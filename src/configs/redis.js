import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1", // Default: localhost
  port: process.env.REDIS_PORT || 6379, // Default: 6379
  password: process.env.REDIS_PASSWORD || undefined, // Optional if Redis requires authentication
});

redis.on("connect", () => {
  console.log("🟢 Connected to Redis successfully!");
});

redis.on("error", (err) => {
  console.error("🔴 Redis connection error:", err);
});

export default redis;
