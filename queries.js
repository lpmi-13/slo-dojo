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

const getUsers = (request, response) => {
    pool.query("SELECT * FROM users ORDER BY user_id ASC", (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};

const getUserById = (request, response) => {
    const id = parseInt(request.params.id);

    pool.query(
        "SELECT * FROM users WHERE user_id = $1",
        [id],
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).json(results.rows);
        }
    );
};

const createUser = (request, response) => {
    const { name, email } = request.body;

    pool.query(
        "INSERT INTO users (user_name, user_email, user_location) VALUES ($1, $2, $3) RETURNING *",
        [name, email],
        (error, results) => {
            if (error) {
                throw error;
            }
            response
                .status(201)
                .send(`User added with ID: ${results.rows[0].id}`);
        }
    );
};

const updateUser = (request, response) => {
    const id = parseInt(request.params.id, 10);
    const { name, email } = request.body;

    pool.query(
        "UPDATE users SET user_name = $1, user_email = $2, user_location = $3 WHERE id = $4",
        [name, email, id],
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).send(`User modified with ID: ${id}`);
        }
    );
};

const deleteUser = (request, response) => {
    const id = parseInt(request.params.id);

    pool.query(
        "DELETE FROM users WHERE user_id = $1",
        [id],
        (error, results) => {
            if (error) {
                throw error;
            }
            response.status(200).send(`User deleted with ID: ${id}`);
        }
    );
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
