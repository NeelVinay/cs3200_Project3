// demo.js — exercises every CRUD operation on the Redis sorted set.
// Usage: npm run demo   (run `npm run seed` first)

const { client, connect } = require("./redisClient");
const mv = require("./mostViewed");

function hr(label) {
  console.log(`\n----- ${label} -----`);
}

async function main() {
  await connect();

  hr("READ: top 5 most-viewed publications (with scores)");
  const top5 = await mv.getTopN(5, true);
  top5.forEach((r, i) =>
    console.log(`  #${i + 1}  ${r.value.padEnd(8)} views=${r.score}`),
  );

  hr("READ: single-publication lookups");
  console.log(`  getViewCount(pub_002)  = ${await mv.getViewCount("pub_002")}`);
  console.log(`  getRank(pub_002)       = ${await mv.getRank("pub_002")}`);
  console.log(`  getTotalCount()        = ${await mv.getTotalCount()}`);

  hr("UPDATE: record 3 new views on pub_004 via ZINCRBY");
  for (let i = 0; i < 3; i++) {
    const newScore = await mv.recordView("pub_004");
    console.log(`  pub_004 score now ${newScore}`);
  }

  hr("UPDATE: overwrite pub_008 to exactly 500 views via ZADD");
  await mv.setViewCount("pub_008", 500);
  console.log(`  pub_008 score now ${await mv.getViewCount("pub_008")}`);

  hr("CREATE: add a new publication pub_999 with 10 initial views");
  await mv.addPublication("pub_999", 10);
  console.log(`  pub_999 score = ${await mv.getViewCount("pub_999")}`);
  console.log(`  total publications tracked = ${await mv.getTotalCount()}`);

  hr("READ: new top-5 after updates");
  const newTop = await mv.getTopN(5, true);
  newTop.forEach((r, i) =>
    console.log(`  #${i + 1}  ${r.value.padEnd(8)} views=${r.score}`),
  );

  hr("DELETE: remove pub_999 via ZREM");
  await mv.removePublication("pub_999");
  console.log(
    `  pub_999 score after removal = ${await mv.getViewCount("pub_999")}  (null = gone)`,
  );
  console.log(`  total publications tracked = ${await mv.getTotalCount()}`);

  hr("Demo complete");
  await client.quit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
