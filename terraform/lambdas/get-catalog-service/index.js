const redis = require("./redisClient");

exports.handler = async () => {
  try {
    let catalog = [];

    if (redis) {
      const data = await redis.get("catalog");
      if (data) catalog = JSON.parse(data);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(catalog)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error getting catalog",
        details: error.message
      })
    };
  }
};