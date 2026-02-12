import fs from "fs";
import path from "path";

const tryCatch = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next)
        } catch (error) {
            console.error("Error in tryCatch middleware:", error);
            try {
                const logMsg = `[${new Date().toISOString()}] CAUGHT EXCEPTION: ${error.name} - ${error.message}\n${error.stack}\n\n`;
                fs.appendFileSync(path.join(process.cwd(), 'debug_error.log'), logMsg);
            } catch (fsError) {
                console.error("Failed to log to file:", fsError);
            }
            res.status(500).json({
                message: error.message
            })
        }
    }
}

export default tryCatch