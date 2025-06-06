const request = require('supertest');
const express = require('express');
const favoritesRoutes = require('../routes/favorites');
const getDbConnection = require('../db');
const auth = require('../middleware/jwtAuth');

// Créer une application Express
const app = express();
app.use(express.json());

// Mock le middleware d'authentification
jest.mock('../middleware/jwtAuth', () => (req, res, next) => {
    req.user = { id: 123 };
    next();
});

app.use('/api/favorites', favoritesRoutes);

// Mock la connexion à la base de données
jest.mock('../db', () => jest.fn());

describe('Favorites Routes', () => {
    let mockConnection;
    beforeEach(() => {
        // Créez un mock de l'objet de connexion pour chaque test
        mockConnection = {
            query: jest.fn(),
            // Ajoutez d'autres méthodes de connexion si vos routes les utilisent (ex: .end())
        };

        // Configurez getDbConnection pour retourner le mockConnection
        getDbConnection.mockResolvedValue(mockConnection); // Cette ligne est cruciale

        // Réinitialiser tous les mocks avant chaque test
        // Réinitialiser getDbConnection elle-même
        getDbConnection.mockClear(); // Réinitialise le mock de la fonction getDbConnection
        mockConnection.query.mockReset(); // Réinitialise le mock de la méthode query
    });

    // Test POST /api/favorites
    test('POST /api/favorites - should add a restaurant to favorites', async () => {
        mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .post('/api/favorites')
            .send({ restaurant_id: 'resto123' })
            .set('Authorization', 'Bearer dummy_token'); // Jeton factice, car le middleware est mocké

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ success: true });
        expect(getDbConnection).toHaveBeenCalled();
        expect(mockConnection.query).toHaveBeenCalledWith(
            'INSERT IGNORE INTO favorites (user_id, restaurant_id) VALUES (?, ?)',
            [123, 'resto123']
        );
    });

    test('POST /api/favorites - should return 500 on database error', async () => {
        mockConnection.query.mockRejectedValueOnce(new Error('DB insert error'));

        const res = await request(app)
            .post('/api/favorites')
            .send({ restaurant_id: 'resto123' })
            .set('Authorization', 'Bearer dummy_token');

        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({ error: 'Erreur ajout favoris' });
    });

    test('GET /api/favorites/:restaurant_id - should return true if restaurant is favorite', async () => {
        mockConnection.query.mockResolvedValueOnce([[{}]]); // Simule une ligne trouvée

        const res = await request(app)
            .get('/api/favorites/resto456')
            .set('Authorization', 'Bearer dummy_token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ favorite: true });
        expect(getDbConnection).toHaveBeenCalled();
        expect(mockConnection.query).toHaveBeenCalledWith(
            'SELECT 1 FROM favorites WHERE user_id=? AND restaurant_id=? LIMIT 1',
            [123, 'resto456']
        );
    });

    test('GET /api/favorites/:restaurant_id - should return false if restaurant is not favorite', async () => {
        mockConnection.query.mockResolvedValueOnce([[]]); // Simule aucune ligne trouvée

        const res = await request(app)
            .get('/api/favorites/resto789')
            .set('Authorization', 'Bearer dummy_token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ favorite: false });
    });

    test('GET /api/favorites/:restaurant_id - should return 500 on database error', async () => {
        mockConnection.query.mockRejectedValueOnce(new Error('DB select error'));

        const res = await request(app)
            .get('/api/favorites/resto_error')
            .set('Authorization', 'Bearer dummy_token');

        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({ error: 'Erreur vérif favoris' });
    });

    // Test DELETE /api/favorites/:restaurant_id
    test('DELETE /api/favorites/:restaurant_id - should delete a restaurant from favorites', async () => {
        mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .delete('/api/favorites/resto_to_delete')
            .set('Authorization', 'Bearer dummy_token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ success: true, message: 'Deleted' });
        expect(getDbConnection).toHaveBeenCalled();
        expect(mockConnection.query).toHaveBeenCalledWith(
            'DELETE FROM favorites WHERE user_id=? AND restaurant_id=?',
            [123, 'resto_to_delete']
        );
    });

    test('DELETE /api/favorites/:restaurant_id - should return 404 if restaurant not found in favorites', async () => {
        mockConnection.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

        const res = await request(app)
            .delete('/api/favorites/non_existent_resto')
            .set('Authorization', 'Bearer dummy_token');

        expect(res.statusCode).toEqual(404);
        expect(res.body).toEqual({ error: 'non trouvé' });
    });

    test('DELETE /api/favorites/:restaurant_id - should return 500 on database error', async () => {
        mockConnection.query.mockRejectedValueOnce(new Error('DB delete error'));

        const res = await request(app)
            .delete('/api/favorites/resto_delete_error')
            .set('Authorization', 'Bearer dummy_token');

        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({ error: 'Erreur suppression' });
    });
});