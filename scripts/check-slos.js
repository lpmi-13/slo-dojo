const prometheusUrl = process.env.PROMETHEUS_URL || "http://localhost:9090";

const checks = [
    {
        name: "Homepage latency SLO",
        query: `slo_dojo:homepage_requests_per_second:max5m > 0
            and on() slo_dojo:homepage_p95_seconds:max5m <= 0.15`,
    },
    {
        name: "Login success SLO",
        query: `slo_dojo:login_attempts_per_second:max5m > 0
            and on() slo_dojo:login_failure_ratio:max5m <= 0.005`,
    },
    {
        name: "Search latency SLO",
        query: `slo_dojo:search_requests_per_second:max5m > 0
            and on() slo_dojo:search_p95_seconds:max5m <= 0.05`,
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
