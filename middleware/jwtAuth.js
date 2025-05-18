const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({error: 'Token is missing'});

    try{
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch(err) {
        res.status(401).json({error: 'Token is invalid'});
    }
}

module.exports = auth;