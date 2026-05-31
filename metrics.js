const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({
    prefix: "slo_dojo_",
    register,
});

const httpRequestDuration = new client.Histogram({
    name: "slo_dojo_http_request_duration_seconds",
    help: "HTTP request duration in seconds.",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1, 2, 5],
    registers: [register],
});

const dbQueryDuration = new client.Histogram({
    name: "slo_dojo_db_query_duration_seconds",
    help: "Selected database query duration in seconds.",
    labelNames: ["query"],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 1, 2, 5],
    registers: [register],
});

const loginAttempts = new client.Counter({
    name: "slo_dojo_login_attempts_total",
    help: "Login attempts by result.",
    labelNames: ["result"],
    registers: [register],
});

function getRouteLabel(request) {
    if (request.route && request.route.path) {
        return `${request.baseUrl || ""}${request.route.path}`;
    }

    return request.path || "unknown";
}

function httpMetricsMiddleware(request, response, next) {
    if (request.path === "/metrics") {
        return next();
    }

    const endTimer = httpRequestDuration.startTimer({
        method: request.method,
    });

    response.on("finish", () => {
        endTimer({
            route: getRouteLabel(request),
            status_code: String(response.statusCode),
        });
    });

    return next();
}

async function metricsHandler(request, response, next) {
    try {
        response.set("Content-Type", register.contentType);
        response.end(await register.metrics());
    } catch (error) {
        next(error);
    }
}

async function observeDbQuery(name, fn) {
    const endTimer = dbQueryDuration.startTimer({ query: name });

    try {
        return await fn();
    } finally {
        endTimer();
    }
}

module.exports = {
    httpMetricsMiddleware,
    loginAttempts,
    metricsHandler,
    observeDbQuery,
    register,
};
