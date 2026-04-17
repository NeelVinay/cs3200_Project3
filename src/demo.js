// demo.js — walks through every CRUD operation on the Redis sorted set.
// Usage: npm run demo   (run `npm run seed` first to load sample data)

const { client, connect } = require("./redisClient");
const mv = require("./mostViewed");

// hr() is just a helper that prints a section header so the output is readable
function hr(label) {
  console.log(`\n----- ${label} -----`);
}

async function main() {
  // Open the connection to Redis before doing anything
  await connect();

  // ── READ ────────────────────────────────────────────────────────────────────

  hr("READ: top 5 most-viewed publications (with scores)");
  // getTopN asks Redis for the top N entries in the sorted set, highest score first.
  // Redis command: ZREVRANGE mostViewed:global 0 4 WITHSCORES
  const top5 = await mv.getTopN(5, true);
  top5.forEach((r, i) =>
    console.log(`  #${i + 1}  ${r.value.padEnd(8)} views=${r.score}`),
  );

  hr("READ: single-publication lookups");
  // getViewCount → ZSCORE: returns the score (view count) for one specific member
  console.log(`  getViewCount(pub_002)  = ${await mv.getViewCount("pub_002")}`);
  // getRank → ZREVRANK: returns the 0-based position in the ranking (0 = most viewed)
  console.log(`  getRank(pub_002)       = ${await mv.getRank("pub_002")}`);
  // getTotalCount → ZCARD: returns how many members are in the sorted set
  console.log(`  getTotalCount()        = ${await mv.getTotalCount()}`);

  // ── UPDATE ──────────────────────────────────────────────────────────────────

  hr("UPDATE: record 3 new views on pub_004 via ZINCRBY");
  // recordView → ZINCRBY: atomically adds 1 to the score each time it's called.
  // Atomic means even if 1000 users click at the same time, no views get lost.
  for (let i = 0; i < 3; i++) {
    const newScore = await mv.recordView("pub_004");
    console.log(`  pub_004 score now ${newScore}`);
  }

  hr("UPDATE: overwrite pub_008 to exactly 500 views via ZADD");
  // setViewCount → ZADD with a new score: overwrites whatever the count was before.
  // Use this when you need to set an exact number rather than increment.
  await mv.setViewCount("pub_008", 500);
  console.log(`  pub_008 score now ${await mv.getViewCount("pub_008")}`);

  // ── CREATE ──────────────────────────────────────────────────────────────────

  hr("CREATE: add a new publication pub_999 with 10 initial views");
  // addPublication → ZADD: adds a brand new member to the sorted set with an initial score.
  // If the member already exists, ZADD just updates the score instead.
  await mv.addPublication("pub_999", 10);
  console.log(`  pub_999 score = ${await mv.getViewCount("pub_999")}`);
  console.log(`  total publications tracked = ${await mv.getTotalCount()}`);

  hr("READ: new top-5 after updates");
  // Reading again to show that pub_008 (now 500) jumped to #1 after the overwrite above
  const newTop = await mv.getTopN(5, true);
  newTop.forEach((r, i) =>
    console.log(`  #${i + 1}  ${r.value.padEnd(8)} views=${r.score}`),
  );

  // ── DELETE ──────────────────────────────────────────────────────────────────

  hr("DELETE: remove pub_999 via ZREM");
  // removePublication → ZREM: removes a single member from the sorted set entirely.
  await mv.removePublication("pub_999");
  // getViewCount will return null now because the member no longer exists
  console.log(
    `  pub_999 score after removal = ${await mv.getViewCount("pub_999")}  (null = gone)`,
  );
  console.log(`  total publications tracked = ${await mv.getTotalCount()}`);

  hr("Demo complete");
  // Close the Redis connection cleanly when we're done
  await client.quit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
