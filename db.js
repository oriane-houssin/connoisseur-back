const mysql = require('mysql2/promise');
require('dotenv').config();

let connection;

// Fonction pour obtenir la connexion (qui peut être appelée plusieurs fois)
// C'est un singleton pattern pour la connexion à la BDD
async function getDbConnection() {
    if (connection) {
        return connection; // Si la connexion existe déjà, la retourner
    }

    const dbUrl = process.env.JAWSDB_URL

    if (dbUrl) {
        connection = await mysql.createConnection(dbUrl);
        console.log('Connected to MySQL database on Heroku (production)');
    } else {
        const localConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        };
        connection = await mysql.createConnection(localConfig);
        console.log('Connected to MySQL database locally (development)');
    }
    return connection;
}

module.exports = getDbConnection;