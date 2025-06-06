const express = require('express');
const router = express.Router();
const getDbConnection = require('../db');
const auth = require('../middleware/jwtAuth');

//CREATE LIST
router.post('/', auth, async (req, res) => {
    const {name, description} = req.body;
    const user_id = req.user.id;

    if (!name) {
        return res.status(400).send({error: 'Missing name'});
    }
    try {
        const connection = await getDbConnection();
        const [result] = await connection.query('INSERT INTO user_lists (user_id, name, description) VALUES (?,?,?)', [user_id, name, description]);
        res.status(201).json({success: true, message: `Successfully created`, list_id: result.insertId});
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {return res.status(409).json({error: 'Vous avez déjà une liste avec le même nom'});}
        res.status(500).json({error: 'Erreur serveur lors de la création de votre liste.'});
    }
});

//READ LISTS
router.get('/', auth, async (req, res) => {
    const user_id = req.user.id;

    try {
        const connection = await getDbConnection();
        const [rows] = await connection.query('SELECT id, name, description, created_at FROM user_lists WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Erreur serveur'});
    }
});

//READ LIST BY ID
router.get('/:list_id', auth, async (req, res) => {
    const { list_id } = req.params;
    const user_id = req.user.id;

    try {
        const connection = await getDbConnection();
        const [listRows] = await connection.query('SELECT id, name, description, created_at FROM user_lists WHERE id = ? AND user_id = ? LIMIT 1', [list_id, user_id]);
        if (listRows.length === 0) {
            return res.status(404).json({error: 'Liste non trouvée'});
        }
        const [restaurantRows] = await connection.query('SELECT restaurant_id, added_at FROM list_restaurant WHERE list_id = ? ORDER BY added_at DESC', [list_id]);
        res.json({
            list: listRows[0],
            restaurants: restaurantRows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Erreur serveur'});
    }
});

//UPDATE LIST BY ID
router.put('/:list_id', auth, async (req, res) => {
    const { list_id } = req.params;
    const user_id = req.user.id;
    const { name, description } = req.body;

    if (!name && !description) {
        return res.status(400).json({error: 'Au moins le nom ou la description est requis pour la mise à jour.'});
    }
    try {
        const connection = await getDbConnection();
        const [result] = await connection.query('UPDATE user_lists SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ? AND user_id = ?',
            [name, description, list_id, user_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'Liste non trouvée'});
        }
        res.json({success: true, message: 'Liste mise à jour avec succès'});
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({error: 'Vous avez déjà un liste avec ce nom'});
        }
        res.status(500).json({error: 'Erreur serveur'});
    }
});

//DELETE LIST BY ID
router.delete('/:list_id', auth, async (req, res) => {
    const { list_id } = req.params;
    const user_id = req.user.id;

    try {
        const connection = await getDbConnection();
        const [result] = await connection.query('DELETE FROM user_lists WHERE id = ? AND user_id = ?', [list_id, user_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'Liste non trouvée'});
        }
        res.json({success: true, message: 'Liste supprimée avec succès.'});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Erreur serveur'});
    }
});

//-------------- CRUD RESTAURANTS DANS LISTES --------------------------------

//(CREATE) ADD RESTAURANT TO LIST
router.post('/:list_id/restaurants', auth, async (req, res) => {
    const { list_id } = req.params;
    const { restaurant_id } = req.body;
    const user_id = req.user.id;

    if (!restaurant_id) {
        return res.status(400).json({error: 'ID du restaurant est requis'});
    }

    try {
        const connection = await getDbConnection();
        const [listCheck] = await connection.query('SELECT id FROM user_lists WHERE id = ? AND user_id = ? LIMIT 1', [list_id, user_id]);
        if (listCheck.length === 0) {
            return res.status(404).json({error: 'Liste non trouvée'});
        }

        const [result] = await connection.query('INSERT IGNORE INTO list_restaurant (list_id, restaurant_id) VALUES (?,?)', [list_id, restaurant_id]);
        if (result.affectedRows > 0) {
            res.status(201).json({succes: true, message: 'Restaurant ajouté à la liste'});
        } else {
            res.status(409).json({error: 'Le restaurant est déjà présent dans cette liste'});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Erreur serveur'});
    }
});

//DELETE RESTAURANT OF LIST
router.delete('/:list_id/restaurants/:restaurant_id', auth, async (req, res) => {
    const { list_id, restaurant_id } = req.params;
    const user_id = req.user.id;

    try {
        const connection = await getDbConnection();
        const [listCheck] = await connection.query('SELECT id FROM user_lists WHERE id = ? AND user_id = ? LIMIT 1', [list_id, user_id]);
        if (listCheck.length === 0) {
            return res.status(404).json({error: 'Liste non trouvée'});
        }

        const [result] = await connection.query('DELETE FROM list_restaurant WHERE restaurant_id = ? AND list_id = ?', [restaurant_id, list_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({error: 'Restaurant non trouvé'});
        }
        res.json({success: true, message: 'Restaurant supprimé de la liste avec succès'});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Erreur serveur'});
    }
});


module.exports = router;