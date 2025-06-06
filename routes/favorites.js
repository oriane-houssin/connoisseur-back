const express = require('express');
const router = express.Router();
const connection = require('../db');
const auth = require('../middleware/jwtAuth');

//Ajout du resto en favoris
router.post('/', auth, async (req, res) => {
    const { restaurant_id } = req.body;
    const user_id = req.user.id;

    try {
        await connection.query('INSERT IGNORE INTO favorites (user_id, restaurant_id) VALUES (?, ?)', [user_id, restaurant_id]);
        res.json({success: true});
    } catch (error) {
        console.error("Erreur MySQL:", error);
        res.status(500).json({error: 'Erreur ajout favoris'});
    }
});

//Check si le resto est en favoris ou non
router.get('/:restaurant_id', auth, async (req, res) => {
    const { restaurant_id } = req.params;
    const user_id = req.user.id;

    try {
        const [rows] = await connection.query(
            'SELECT 1 FROM favorites WHERE user_id=? AND restaurant_id=? LIMIT 1', [user_id, restaurant_id]
        );

        const isFavorite = rows.length > 0;
        res.json({favorite: isFavorite});
    } catch (err) {
        console.error("Erreur check favorites: ", err);
        res.status(500).json({error: 'Erreur vérif favoris'});
    }
});

//SUPPRIMER RESTO DES FAV
router.delete('/:restaurant_id', auth, async (req, res) => {
    const { restaurant_id } = req.params;
    const user_id = req.user.id;
    try {
        const [rows] = await connection.query('DELETE FROM favorites WHERE user_id=? AND restaurant_id=?', [user_id, restaurant_id]);
        if(rows.affectedRows > 0) {
            res.json({success: true, message: 'Deleted' });
        } else {
            res.status(404).json({error: 'non trouvé'});
        }
    } catch (error) {
        console.error("Erreur suppression:", error);
        res.status(500).json({error: 'Erreur suppression'});
    }
})

module.exports = router;