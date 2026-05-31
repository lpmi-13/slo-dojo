const assert = require("node:assert/strict");
const test = require("node:test");

const { hashPassword, varyEmailCase } = require("../auth");

test("hashPassword returns the seeded workshop password hash", () => {
    assert.equal(
        hashPassword("slo-dojo-password"),
        "a0f07c416a189d1535ade6fb85b58c9e9887fad975a1533fd1fb97d6cbd9daaf"
    );
});

test("varyEmailCase preserves email identity while changing letter case", () => {
    const email = "learner01@example.com";
    const varied = varyEmailCase(email, 1);

    assert.notEqual(varied, email);
    assert.equal(varied.toLowerCase(), email);
});
