const prometheusUrl = process.env.PROMETHEUS_URL || "http://localhost:9090";

const checks = [
    {
        name: "Homepage latency SLO",
        query: `histogram_quantile(
            0.95,
            sum(rate(slo_dojo_http_request_duration_seconds_bucket{route="/",status_code=~"2.."}[1m])) by (le)
        ) <= 0.15`,
    },
    {
        name: "Login success SLO",
        query: `(
            sum(rate(slo_dojo_login_attempts_total{result="failure"}[1m]))
            /
            sum(rate(slo_dojo_login_attempts_total[1m]))
        ) <= 0.005`,
    },
    {
        name: "Search latency SLO",
        query: `histogram_quantile(
            0.95,
            sum(rate(slo_dojo_http_request_duration_seconds_bucket{route="/search",status_code=~"2.."}[1m])) by (le)
        ) <= 0.05`,
    },
];

async function queryPrometheus(query) {
    const url = new URL("/api/v1/query", prometheusUrl);
    url.searchParams.set("query", query);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Prometheus returned ${response.status}`);
    }

    const body = await response.json();

    if (body.status !== "success") {
        throw new Error(body.error || "Prometheus query failed");
    }

    return body.data.result.length > 0;
}

async function main() {
    const results = [];

    for (const check of checks) {
        const resolved = await queryPrometheus(check.query);
        results.push({ ...check, resolved });
    }

    for (const result of results) {
        console.log(`${result.name}: ${result.resolved ? "resolved" : "breached"}`);
    }

    const allResolved = results.every((result) => result.resolved);
    console.log(`All workshop SLOs: ${allResolved ? "resolved" : "breached"}`);

    process.exitCode = allResolved ? 0 : 1;
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
