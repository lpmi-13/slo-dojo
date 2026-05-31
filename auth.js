const crypto = require("crypto");

function hashPassword(password) {
    return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function varyEmailCase(email, seed) {
    return String(email)
        .split("")
        .map((character, index) => {
            if (!/[a-z]/i.test(character)) {
                return character;
            }

            return (index + seed) % 2 === 0
                ? character.toUpperCase()
                : character.toLowerCase();
        })
        .join("");
}

module.exports = {
    hashPassword,
    varyEmailCase,
};
