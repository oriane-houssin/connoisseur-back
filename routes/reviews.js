const express = require('express');
const router = express.Router();
const connection = require('../db');
const auth = require('../middleware/jwtAuth');

//CREATE REVIEW
router.post('/', auth, async (req, res) => {
    const {restaurant_id, comment} = req.body;
    const user_id = req.user.id;

    if (!restaurant_id || !comment) {
        return res.status(400).json({error: 'restaurant_id et comment sont requis'});
    }

    try {
        const [result] = await connection.query('INSERT INTO reviews (user_id, restaurant_id, comment) VALUES (?,?,?)', [user_id, restaurant_id, comment]);
        if (result.affectedRows > 0) {
            res.status(201).json({success: true, message: 'Reviewed'});
        } else {
            res.status(500).json({error: 'Something went wrong'});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Something went wrong'});
    }
});

//READ REVIEWS DE X RESTAURANT
router.get('/:restaurant_id', async (req, res) => {
    const {restaurant_id} = req.params;

    try {
        const [rows] = await connection.query('SELECT users.username, reviews.comment, reviews.created_at FROM reviews INNER JOIN users ON reviews.user_id = users.id WHERE restaurant_id = ? ORDER BY reviews.created_at DESC', [restaurant_id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Something went wrong'});
    }
});

module.exports = router;