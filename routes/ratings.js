const express = require('express');
const router = express.Router();
const getDbConnection = require('../db');
const auth = require('../middleware/jwtAuth');

//CREATE + UPDATE rating
router.post('/', auth, async (req, res) => {
    const {restaurant_id, rating} = req.body;
    const user_id = req.user.id;

    if (!restaurant_id || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({error: 'Please enter a valid rating (1-5) and restaurant ID'});
    }
    try {
        const connection = await getDbConnection();
        const [result] = await connection.query('INSERT INTO ratings (user_id, restaurant_id, rating) VALUES (?,?,?) ON DUPLICATE KEY UPDATE rating = ?',
            [user_id, restaurant_id, rating, rating]);
        if (result.affectedRows > 0) {
            res.status(200).json({success: true, message: 'Successfully inserted/ updated rating'});
        } else {
            res.status(500).json({error: 'Something went wrong'});
        }
    } catch (error) {
        console.error("Erreur rating:", error);
        res.status(500).json({error: 'Something went wrong'});
    }
});

//READ rating
router.get('/:restaurant_id', auth, async (req, res) => {
    const {restaurant_id} = req.params;
    const user_id = req.user.id;

    try {
        const connection = await getDbConnection();
        const [rows] = await connection.query('SELECT rating FROM ratings WHERE user_id=? AND restaurant_id=? LIMIT 1', [user_id, restaurant_id]);
        if (rows.length > 0) {
            res.json({userRating: rows[0].rating});
        } else {
            res.json({userRating: null});
        }
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({error: 'Something went wrong'});
    }
});

module.exports = router;
