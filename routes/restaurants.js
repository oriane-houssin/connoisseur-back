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
            michelin: r.fields.stars || null,
            city: r.fields.meta_name_com || null,
            brand: r.fields.brand || null,
            rating: Math.floor(Math.random() * 5) + 1
        }));
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({error: 'Erreur serveur'});
    }
});

module.exports = router;

// Récupère un restaurant depuis l'id des params
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    console.log(`Backend received request for restaurant id: ${id}`);
    try {
        const response = await axios.get('https://public.opendatasoft.com/api/records/1.0/search/', {
            params: {
                dataset: 'osm-france-food-service',
                q: `recordid:"${id}"`,
                rows: 1
            }
        });

        console.log("Open Data Soft API response:", response.data)
        if (response.data.records.length === 0) {
            return res.status(404).json({error: 'Restaurant not found'})
        }
        const r = response.data.records[0];
        res.json({
            id: r.recordid,
            name: r.fields.name,
            cuisine: r.fields.cuisine || 'Non spécifiée',
            vegetarian: r.fields.vegetarian || null,
            vegan: r.fields.vegan || null,
            opening_hours: r.fields.opening_hours || "Non spécifiés",
            wheelchair: r.fields.wheelchair || null,
            delivery: r.fields.delivery || "Non spécifié",
            takeaway: r.fields.takeaway || "Non spécifié",
            michelin: r.fields.stars || null,
            phone: r.fields.phone || null,
            website: r.fields.website || null,
            city: r.fields.meta_name_com || null,
            department: r.fields.meta_name_dep || null,
            departmentCode: r.fields.meta_code_dep || null,
            street: r.fields['addr:street'] || null,
            housenumber: r.fields['addr:housenumber'] || null,
            brand: r.fields.brand || "Indépendant",
            date: r.record_timestamp,
            rating: Math.floor(Math.random() * 5) + 1,
            creation: r.meta_first_update || null,
        });
    } catch (error) {
        res.status(500).json({error: 'Erreur serveur'});
    }
})
