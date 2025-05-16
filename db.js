const mysql = require('mysql2/promise');
// promise permet d'utiliser async/await au lieu de callbacks
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

module.exports = connection;