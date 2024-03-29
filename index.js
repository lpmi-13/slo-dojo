const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

const db = require("./queries");

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.get("/", (request, response) => {
    response.json({ info: "This is the Slo Dojo!" });
});

app.get("/customers", db.getCustomers);
app.get("/customers/:id", db.getCustomerById);

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
