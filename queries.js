const { Pool } = require("pg");

const { hashPassword } = require("./auth");
const metrics = require("./metrics");

const pool = new Pool({
    user: process.env.DB_USER || "apiuser",
    host: process.env.DB_HOST || "postgres",
    database: process.env.DB_NAME || "api",
    password: process.env.DB_PASSWORD || "apicontrol",
    port: Number(process.env.DB_PORT || 5432),
});

function query(name, text, params = []) {
    return metrics.observeDbQuery(name, () => pool.query(text, params));
}

function parsePositiveInteger(value, fallback, max) {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }

    return Math.min(parsed, max);
}

async function getHomePage(request, response, next) {
    try {
        const featuredProducts = await query(
            "homepage_random_featured_products",
            `SELECT
                p.product_id,
                p.product_name,
                p.sku,
                p.weight,
                s.seller_name,
                c.color_name
            FROM products p
            JOIN sellers s ON s.seller_id = p.seller_id
            JOIN colors c ON c.color_id = p.color_id
            ORDER BY random()
            LIMIT 24`
        );

        const cards = [];

        for (const product of featuredProducts.rows) {
            const reviewSummary = await query(
                "homepage_product_review_summary",
                `SELECT
                    COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating,
                    COUNT(*)::int AS review_count
                FROM reviews
                WHERE product_id = $1`,
                [product.product_id]
            );

            const purchaseSummary = await query(
                "homepage_product_purchase_summary",
                `SELECT COUNT(*)::int AS purchase_count
                FROM purchases
                WHERE product_id = $1`,
                [product.product_id]
            );

            cards.push({
                ...product,
                average_rating: Number(reviewSummary.rows[0].average_rating),
                review_count: reviewSummary.rows[0].review_count,
                purchase_count: purchaseSummary.rows[0].purchase_count,
            });
        }

        response.status(200).json({
            title: "SLO Dojo Storefront",
            featured_products: cards,
        });
    } catch (error) {
        next(error);
    }
}

async function getCustomers(request, response, next) {
    try {
        const limit = parsePositiveInteger(request.query.limit, 100, 500);
        const offset = parsePositiveInteger(request.query.offset, 1, 1000000) - 1;
        const results = await query(
            "customers_list",
            `SELECT customer_id, customer_name, customer_email, customer_location
            FROM customers
            ORDER BY customer_id ASC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        response.status(200).json(results.rows);
    } catch (error) {
        next(error);
    }
}

async function getCustomerById(request, response, next) {
    try {
        const id = Number.parseInt(request.params.id, 10);

        if (!Number.isFinite(id)) {
            return response.status(400).json({ error: "invalid_customer_id" });
        }

        const results = await query(
            "customer_by_id",
            `SELECT customer_id, customer_name, customer_email, customer_location
            FROM customers
            WHERE customer_id = $1`,
            [id]
        );

        if (results.rowCount === 0) {
            return response.status(404).json({ error: "customer_not_found" });
        }

        return response.status(200).json(results.rows[0]);
    } catch (error) {
        return next(error);
    }
}

async function login(request, response, next) {
    try {
        const email = String(request.body.email || "");
        const password = String(request.body.password || "");

        if (!email || !password) {
            metrics.loginAttempts.inc({ result: "failure" });
            return response.status(400).json({ error: "email_and_password_required" });
        }

        const results = await query(
            "login_customer_lookup",
            `SELECT customer_id, customer_name, customer_email
            FROM customers
            WHERE customer_email = $1
                AND password_hash = $2`,
            [email, hashPassword(password)]
        );

        if (results.rowCount === 0) {
            metrics.loginAttempts.inc({ result: "failure" });
            return response.status(401).json({ error: "invalid_credentials" });
        }

        metrics.loginAttempts.inc({ result: "success" });
        return response.status(200).json({
            customer_id: results.rows[0].customer_id,
            customer_name: results.rows[0].customer_name,
            customer_email: results.rows[0].customer_email,
        });
    } catch (error) {
        metrics.loginAttempts.inc({ result: "failure" });
        return next(error);
    }
}

async function searchProducts(request, response, next) {
    try {
        const q = String(request.query.q || "").trim().toLowerCase();

        if (q.length < 2) {
            return response.status(400).json({ error: "query_must_be_at_least_two_characters" });
        }

        const results = await query(
            "product_search_prefix",
            `SELECT
                p.product_id,
                p.product_name,
                p.sku,
                p.weight,
                s.seller_name,
                c.color_name
            FROM products p
            JOIN sellers s ON s.seller_id = p.seller_id
            JOIN colors c ON c.color_id = p.color_id
            WHERE lower(p.product_name) LIKE $1 || '%'
            ORDER BY p.product_name ASC
            LIMIT 50`,
            [q]
        );

        return response.status(200).json({
            query: q,
            results: results.rows,
        });
    } catch (error) {
        return next(error);
    }
}

async function createPurchase(request, response, next) {
    try {
        const { customer_id, seller_id, product_id, date, price, currency } = request.body;
        const results = await query(
            "purchase_create",
            `INSERT INTO purchases (customer_id, seller_id, product_id, date, price, currency)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING purchase_id`,
            [customer_id, seller_id, product_id, date, price, currency]
        );

        return response.status(201).json({ purchase_id: results.rows[0].purchase_id });
    } catch (error) {
        return next(error);
    }
}

async function createReview(request, response, next) {
    try {
        const { reviewer_id, product_id, purchase_id, review_date, review_text, rating } = request.body;
        const results = await query(
            "review_create",
            `INSERT INTO reviews (reviewer_id, product_id, purchase_id, review_date, review_text, rating)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING review_id`,
            [reviewer_id, product_id, purchase_id, review_date, review_text, rating]
        );

        return response.status(201).json({ review_id: results.rows[0].review_id });
    } catch (error) {
        return next(error);
    }
}

async function createReferral(request, response, next) {
    try {
        const {
            seller_id,
            referrer_id,
            referree_id,
            referral_offer_date,
            referral_accepted = false,
        } = request.body;

        const results = await query(
            "referral_create",
            `INSERT INTO referrals (
                seller_id,
                referrer_id,
                referree_id,
                referral_offer_date,
                referral_accepted
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING referral_id`,
            [seller_id, referrer_id, referree_id, referral_offer_date, referral_accepted]
        );

        return response.status(201).json({ referral_id: results.rows[0].referral_id });
    } catch (error) {
        return next(error);
    }
}

async function updateReferral(request, response, next) {
    try {
        const id = Number.parseInt(request.params.id, 10);

        if (!Number.isFinite(id)) {
            return response.status(400).json({ error: "invalid_referral_id" });
        }

        const results = await query(
            "referral_accept",
            `UPDATE referrals
            SET referral_accepted = true
            WHERE referral_id = $1
            RETURNING referral_id`,
            [id]
        );

        if (results.rowCount === 0) {
            return response.status(404).json({ error: "referral_not_found" });
        }

        return response.status(200).json({ referral_id: id, referral_accepted: true });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createPurchase,
    createReferral,
    createReview,
    getCustomerById,
    getCustomers,
    getHomePage,
    login,
    searchProducts,
    updateReferral,
};
