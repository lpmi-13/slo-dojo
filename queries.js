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

const createCustomer = (request, response) => {
    const { name, email } = request.body;

    pool.query(
        "INSERT INTO customers (customer_name, customer_email, customer_location) VALUES ($1, $2, $3) RETURNING *",
        [name, email],
        (error, results) => {
            if (error) {
                throw error;
            }
            response
                .status(201)
                .send(`Customer added with ID: ${results.rows[0].id}`);
        }
    );
};

const updateCustomer = (request, response) => {
    const id = parseInt(request.params.id, 10);
    const { name, email } = request.body;

    pool.query(
        "UPDATE customers SET customer_name = $1, customer_email = $2, customer_location = $3 WHERE id = $4",
        [name, email, id],
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).send(`Customer modified with ID: ${id}`);
        }
    );
};

const deleteCustomer = (request, response) => {
    const id = parseInt(request.params.id);

    pool.query(
        "DELETE FROM customers WHERE customer_id = $1",
        [id],
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).send(`Customer deleted with ID: ${id}`);
        }
    );
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
};
