const express = require('express');
const getDbConnection = require('../db');
const auth = require('../middleware/jwtAuth');
const router = express.Router();

// GET
router.get('/:id', auth, async (req, res) => {
    const connection = await getDbConnection();
    const [rows] = await connection.query('SELECT id, username, email FROM users WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
});

// UPDATE
router.put('/:id', auth, async (req, res) => {
    const connection = await getDbConnection();
    const {username, email} = req.body;
    const [result] = await connection.query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, req.params.id]);
    res.json({message: 'Profile updated successfully.'});
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
    const connection = await getDbConnection();
    await connection.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({message: 'Account deleted successfully.'});
});

module.exports = router;