const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const connection = require('../db');

// SIGN UP
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await connection.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]        );
        res.status(201).json({id: result.insertId, username});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})

// SIGN IN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user) return res.status(400).json({error: 'User not found'});
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({error: 'Invalid password'});
        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
        res.json({token, user : {id: user.id, username: user.username, email: user.email}});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})

module.exports = router;