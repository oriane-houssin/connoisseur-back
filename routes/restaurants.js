const express = require('express');
const router = express.Router();
const axios = require('axios');

// Récupère les restaurants ajoutés le plus récemment
router.get('/latest', async (req, res) => {
    try{
        const response = await axios.get('https://public.opendatasoft.com/api/records/1.0/search/', {
            params: {
                dataset : 'osm-france-food-service',
                rows: 5,
                sort: 'record_timestamp'
            }
        });

        const restaurants = response.data.records.map(r => ({
            id: r.recordid,
            name: r.fields.name,
            cuisine: r.fields.cuisine || null,
            city: r.fields['addr:city'] || null,
            brand: r.fields.brand || null,
            date: r.record_timestamp,
        }));
        res.json(restaurants);
    } catch (error) {
        console.error('Erreur API ODS:', error.message);
        res.status(500).json({error: 'Erreur lors de la récupération des données'});
    }
});

module.exports = router;