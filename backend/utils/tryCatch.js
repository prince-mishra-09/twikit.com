const tryCatch = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next)
        } catch (error) {
            console.error("Error in tryCatch middleware:", error); // Log the full error stack
            res.status(500).json({
                message: error.message
            })
        }
    }
}

export default tryCatch