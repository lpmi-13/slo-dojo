const { response } = require("express");

const Pool = require("pg").Pool;
const pool = new Pool({
    user: "apiuser",
    // we can use the container name inside the compose stack
    host: "postgres",
    database: "api",
    password: "apicontrol",
    port: 5432,
});

const getCustomers = (request, response) => {
    pool.query(
        "SELECT * FROM customers ORDER BY customer_id ASC",
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).json(results.rows);
        }
    );
};

const getCustomerById = (request, response) => {
    const id = parseInt(request.params.id);
    console.log("id is:", id);

    pool.query(
        "SELECT * FROM customers WHERE customer_id = $1",
        [id],
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).json(results.rows);
        }
    );
};

const createPurchase = (request, response) => {
    const { customer_id, seller_id, product_id, date, price, currency } =
        request.body;

    pool.query(
        "INSERT INTO purchases (customer_id, seller_id, product_id, date, price, currency) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [customer_id, seller_id, product_id, date, price, currency],
        (error, results) => {
            if (error) {
                throw error;
            }
            response
                .status(201)
                .send(`Purchase added with ID: ${results.rows[0].id}`);
        }
    );
};

const createReview = (request, response) => {
    const {
        reviewer_id,
        product_id,
        purchase_id,
        review_date,
        review_text,
        rating,
    } = request.body;

    pool.query(
        "INSERT INTO reviews (reviewer_id, product_id, purchase_id, review_date, review_text, rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
            reviewer_id,
            product_id,
            purchase_id,
            review_date,
            review_text,
            rating,
        ],
        (error, results) => {
            if (error) {
                throw error;
            }
            response
                .status(201)
                .send(`Review added with ID: ${results.rows[0].id}`);
        }
    );
};

const createReferral = (request, response) => {
    const {
        seller_id,
        referrer_id,
        referree_id,
        referral_offer_date,
        referral_accepted,
    } = request.body;

    pool.query(
        "INSERT INTO referrals (seller_id, referrer_id, referree_id, referral_offer_date, referral_accepted) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [
            seller_id,
            referrer_id,
            referree_id,
            referral_offer_date,
            referral_accepted,
        ],
        (error, results) => {
            if (error) {
                throw error;
            }
            response
                .status(201)
                .send(`Referral added with ID: ${results.rows[0].id}`);
        }
    );
};

const updateReferral = (request, response) => {
    const id = parseInt(request.params.id, 10);

    pool.query(
        "UPDATE referrals SET offer_accepted = true WHERE referral_id = $1",
        [id],
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).send(`Referral modified with ID: ${id}`);
        }
    );
};

module.exports = {
    getCustomers,
    getCustomerById,
    createPurchase,
    createReview,
    createReferral,
    updateReferral,
};
