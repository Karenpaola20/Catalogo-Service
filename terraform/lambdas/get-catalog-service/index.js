const redis = require("./redisClient");

exports.handler = async (event) => {
    try {
        const data = await redis.get("catalog");
        const catalog = data ? JSON.parse(data) : [];

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },
            body: JSON.stringify(catalog)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                error: "Error getting catalog",
                details: error.message
            })
        };
    }
};