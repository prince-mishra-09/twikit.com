// Metrics Middleware - Tracks API performance and errors
const metricsMiddleware = (metricsCollector) => {
    return (req, res, next) => {
        const startTime = Date.now();

        // Capture response finish event
        res.on('finish', () => {
            const duration = Date.now() - startTime;

            // Record request duration
            metricsCollector.recordRequest(duration);

            // Record error if status code >= 400
            if (res.statusCode >= 400) {
                metricsCollector.recordError();
            }
        });

        next();
    };
};

export default metricsMiddleware;
