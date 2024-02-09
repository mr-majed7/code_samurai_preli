//EXTERNAL IMPORTS
const createError = require('http-errors');

//404 NOT FOUND HANDLER
function notFoundHandler(req, res, next) {
    next(createError(404, 'Your requested content was not found!'));
}

//ERROR HANDLER
function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;
    res.status(statusCode).json({ message: err.message });
}

module.exports = {
    notFoundHandler,
    errorHandler
}