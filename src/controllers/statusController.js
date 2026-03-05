const checkStatus = (req, res) => {
    res.status(200).json({
        message: "conexion exitosa",
        timestamp: new Date()
    });
};

module.exports = { checkStatus };