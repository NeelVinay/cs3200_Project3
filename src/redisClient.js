// redisClient.js — single shared Redis connection for the project.
const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

client.on("error", (err) => {
  console.error("Redis client error:", err.message);
});

async function connect() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

module.exports = { client, connect };
