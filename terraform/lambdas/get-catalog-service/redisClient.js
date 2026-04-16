const Redis = require("ioredis");

let redis = null;

if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    connectTimeout: 2000,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err.message);
  });
} else {
  console.log("Redis disabled (REDIS_HOST / REDIS_PORT not set)");
}

module.exports = redis;