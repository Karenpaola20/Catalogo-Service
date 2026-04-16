const Redis = require("ioredis");

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 5000,
      retryStrategy: times => Math.min(times * 50, 2000),
    });

    redis.on("connect", () => {
      console.log("Redis connected");
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }

  return redis;
}

module.exports = { getRedis };