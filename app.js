const express = require("express");

const db = require("./queries");
const metrics = require("./metrics");

function createApp() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(metrics.httpMetricsMiddleware);

    app.get("/metrics", metrics.metricsHandler);
    app.get("/health", (request, response) => {
        response.status(200).json({ ok: true });
    });

    app.get("/", db.getHomePage);
    app.get("/customers", db.getCustomers);
    app.get("/customers/:id", db.getCustomerById);
    app.post("/login", db.login);
    app.get("/search", db.searchProducts);
    app.post("/purchases", db.createPurchase);
    app.post("/reviews", db.createReview);
    app.post("/referrals", db.createReferral);
    app.put("/referrals/:id/accept", db.updateReferral);

    app.use((error, request, response, next) => {
        console.error(error);
        if (response.headersSent) {
            return next(error);
        }

        return response.status(500).json({
            error: "internal_server_error",
        });
    });

    return app;
}

module.exports = {
    createApp,
};
