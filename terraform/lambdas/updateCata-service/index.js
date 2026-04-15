const fs = require("fs");
const csv = require("csv-parser");
const redis = require("./redisClient");

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);

        // 🔥 aquí usamos JSON en vez de CSV (por ahora)
        await redis.set("catalog", JSON.stringify(body));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Catalog updated",
                total: body.length
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Error updating catalog",
                details: error.message
            })
        };
    }
};