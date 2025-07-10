const errorHandler = (err, req, res, next) => {
    console.error('Global error handler caught:', err);

    const errorDetails = {
        message: err.message,
        stack: err.stack,
        route: req.originalUrl,
        method: req.method,
        time: new Date(),
    };
    console.log("Error details from middleware:", errorDetails);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
