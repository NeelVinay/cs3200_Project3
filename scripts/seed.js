// seed.js — load data/publications.json into the Redis sorted set.
// Usage: npm run seed

const path = require("path");
const fs = require("fs");
const { client, connect } = require("../src/redisClient");
const { KEY, flushAll, addPublication } = require("../src/mostViewed");

async function main() {
  await connect();
  await flushAll();

  const file = path.join(__dirname, "..", "data", "publications.json");
  const pubs = JSON.parse(fs.readFileSync(file, "utf-8"));

  for (const p of pubs) {
    await addPublication(p.id, p.views);
    console.log(`  seeded ${p.id.padEnd(8)} views=${p.views}  (${p.title})`);
  }

  console.log(`\nDone. Loaded ${pubs.length} publications into ZSET "${KEY}".`);
  await client.quit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
