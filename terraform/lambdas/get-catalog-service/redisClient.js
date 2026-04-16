const Redis = require("ioredis");

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 2000,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err.message);
  });
} else {
  console.log("Redis disabled (REDIS_URL not set)");
}

module.exports = redis;