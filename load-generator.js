const { varyEmailCase } = require("./auth");

const baseUrl = process.env.BASE_URL || "http://app:3000";
const password = process.env.DOJO_LOGIN_PASSWORD || "slo-dojo-password";
const homepageIntervalMs = Number(process.env.HOMEPAGE_INTERVAL_MS || 250);
const loginIntervalMs = Number(process.env.LOGIN_INTERVAL_MS || 300);
const searchIntervalMs = Number(process.env.SEARCH_INTERVAL_MS || 350);

const loginEmails = Array.from({ length: 40 }, (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return `learner${suffix}@example.com`;
});

const searchTerms = [
    "atlas",
    "bravo",
    "cinder",
    "delta",
    "ember",
    "fable",
    "glimmer",
    "harbor",
    "ion",
    "juno",
];

let counter = 0;

function choose(items) {
    const item = items[counter % items.length];
    counter += 1;
    return item;
}

async function request(path, options = {}) {
    try {
        const response = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers: {
                "content-type": "application/json",
                ...(options.headers || {}),
            },
        });

        await response.arrayBuffer();
    } catch (error) {
        console.error(`load request failed for ${path}: ${error.message}`);
    }
}

function startLoop(label, intervalMs, fn) {
    setInterval(fn, intervalMs);
    console.log(`${label} workload every ${intervalMs}ms`);
}

startLoop("homepage", homepageIntervalMs, () => {
    request("/");
});

startLoop("login", loginIntervalMs, () => {
    const email = choose(loginEmails);
    const submittedEmail = counter % 2 === 0 ? email : varyEmailCase(email, counter);

    request("/login", {
        method: "POST",
        body: JSON.stringify({
            email: submittedEmail,
            password,
        }),
    });
});

startLoop("search", searchIntervalMs, () => {
    const term = encodeURIComponent(choose(searchTerms));
    request(`/search?q=${term}`);
});
