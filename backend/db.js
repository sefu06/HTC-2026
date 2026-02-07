// connecting to postgreSQL
const { Pool } = require("pg");

const pool = new Pool({
    user: "selinafu",
    host: "localhost",
    database: "grocery_prices",
    password: "",
    port: 5432,
});

module.exports = pool;