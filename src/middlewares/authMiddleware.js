const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_segura';

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    try {
        const decodificado = jwt.verify(token, JWT_SECRET);
        
        req.usuario = decodificado; 
        
        next(); 
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = { verificarToken };