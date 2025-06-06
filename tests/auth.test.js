const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const connection = require('../db'); // Le mock sera appliqué à celui-ci
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Créer une petite application Express pour tester les routes
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock la connexion à la base de données
jest.mock('../db', () => ({
    query: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
}));

// Mock process.env to define JWT_SECRET for tests
const originalEnv = process.env;
beforeAll(() => {
    process.env = {
        ...originalEnv,
        JWT_SECRET: 'test_secret', // Define a test secret here
    };
});

afterAll(() => {
    process.env = originalEnv; // Restore original env after all tests
});

describe('Auth Routes', () => {
    beforeEach(() => {
        // Réinitialiser tous les mocks avant chaque test
        connection.query.mockReset();
        bcrypt.hash.mockReset();
        bcrypt.compare.mockReset();
        jwt.sign.mockReset();
    });

    // Test de l'inscription
    test('POST /api/auth/register - should register a new user', async () => {
        const newUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        };

        bcrypt.hash.mockResolvedValue('hashedpassword123'); // Simule le hachage
        connection.query.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]); // Simule l'insertion DB

        const res = await request(app)
            .post('/api/auth/register')
            .send(newUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({ id: 1, username: 'testuser' });
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        expect(connection.query).toHaveBeenCalledWith(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [newUser.username, newUser.email, 'hashedpassword123']
        );
    });

    test('POST /api/auth/register - should return 500 on database error', async () => {
        const newUser = {
            username: 'testuser',
            email: 'error@example.com',
            password: 'password123',
        };

        bcrypt.hash.mockResolvedValue('hashedpassword');
        connection.query.mockRejectedValueOnce(new Error('DB error')); // Simule une erreur DB

        const res = await request(app)
            .post('/api/auth/register')
            .send(newUser);

        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({ error: 'DB error' });
    });

    // Test de la connexion
    test('POST /api/auth/login - should log in an existing user', async () => {
        const existingUser = {
            email: 'existing@example.com',
            password: 'password123',
        };
        const dbUser = { id: 1, username: 'existinguser', email: 'existing@example.com', password: 'hashedpassword' };
        const token = 'fake_jwt_token';

        connection.query.mockResolvedValueOnce([[dbUser]]); // Simule la recherche de l'utilisateur
        bcrypt.compare.mockResolvedValue(true); // Simule la comparaison de mot de passe réussie
        jwt.sign.mockReturnValue(token); // Simule la génération de JWT

        const res = await request(app)
            .post('/api/auth/login')
            .send(existingUser);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            token,
            user: { id: 1, username: 'existinguser', email: 'existing@example.com' },
        });
        expect(connection.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', [existingUser.email]);
        expect(bcrypt.compare).toHaveBeenCalledWith(existingUser.password, dbUser.password);
        expect(jwt.sign).toHaveBeenCalledWith({ id: dbUser.id }, 'test_secret', { expiresIn: '1h' });
    });

    test('POST /api/auth/login - should return 400 if user not found', async () => {
        const loginData = { email: 'nonexistent@example.com', password: 'password123' };
        connection.query.mockResolvedValueOnce([[]]); // Simule utilisateur non trouvé

        const res = await request(app)
            .post('/api/auth/login')
            .send(loginData);

        expect(res.statusCode).toEqual(400);
        expect(res.body).toEqual({ error: 'User not found' });
    });

    test('POST /api/auth/login - should return 401 if invalid password', async () => {
        const loginData = { email: 'existing@example.com', password: 'wrongpassword' };
        const dbUser = { id: 1, username: 'existinguser', email: 'existing@example.com', password: 'hashedpassword' };

        connection.query.mockResolvedValueOnce([[dbUser]]);
        bcrypt.compare.mockResolvedValue(false); // Simule mot de passe incorrect

        const res = await request(app)
            .post('/api/auth/login')
            .send(loginData);

        expect(res.statusCode).toEqual(401);
        expect(res.body).toEqual({ error: 'Invalid password' });
    });
});