const express = require('express');
const router = express.Router();
const axios = require('axios');

// Récupère les restaurants ajoutés le plus récemment
router.get('/latest', async (req, res) => {
    try{
        const response = await axios.get('https://public.opendatasoft.com/api/records/1.0/search/', {
            params: {
                dataset : 'osm-france-food-service',
                rows: 4,
                sort: 'record_timestamp'
            }
        });

        const restaurants = response.data.records.map(r => ({
            id: r.recordid,
            name: r.fields.name,
            cuisine: r.fields.cuisine || null,
            vegetarian: r.fields.vegetarian || null,
            vegan: r.fields.vegan || null,
            opening_hours: r.fields.opening_hours || null,
            wheelchair: r.fields.wheelchair || null,
            delivery: r.fields.delivery || null,
            takeaway: r.fields.takeaway || null,
            michelin: r.fields.stars || null,
            phone: r.fields.phone || null,
            website: r.fields.website || null,
            city: r.fields.meta_name_com || null,
            brand: r.fields.brand || null,
            date: r.record_timestamp,
            rating: Math.floor(Math.random() * 5) + 1
        }));
        res.json(restaurants);
    } catch (error) {
        console.error('Erreur API ODS:', error.message);
        res.status(500).json({error: 'Erreur lors de la récupération des données'});
    }
});

module.exports = router;