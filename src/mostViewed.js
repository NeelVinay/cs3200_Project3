// mostViewed.js — CRUD operations on the Redis sorted set mostViewed:global.
//   Type:   ZSET
//   Key:    mostViewed:global
//   Member: publication id (e.g. "pub_001")
//   Score:  integer view count

const { connect } = require("./redisClient");

const KEY = "mostViewed:global";

// CREATE — add a publication to the ranking with an initial view count.
async function addPublication(publicationId, initialViews = 0) {
  const c = await connect();
  return c.zAdd(KEY, { score: initialViews, value: publicationId });
}

// READ — top-N publications, highest score first. Pass withScores=true to
// return [{ value, score }, ...] instead of a plain id list.
async function getTopN(n = 5, withScores = false) {
  const c = await connect();
  if (withScores) {
    return c.zRangeWithScores(KEY, 0, n - 1, { REV: true });
  }
  return c.zRange(KEY, 0, n - 1, { REV: true });
}

// READ — view count for a single publication (null if not in set).
async function getViewCount(publicationId) {
  const c = await connect();
  return c.zScore(KEY, publicationId);
}

// READ — rank (0-based) of a publication in the most-viewed ranking.
async function getRank(publicationId) {
  const c = await connect();
  return c.zRevRank(KEY, publicationId);
}

// READ — total number of publications tracked in the ranking.
async function getTotalCount() {
  const c = await connect();
  return c.zCard(KEY);
}

// UPDATE — record a new view (atomic increment).
async function recordView(publicationId, delta = 1) {
  const c = await connect();
  return c.zIncrBy(KEY, delta, publicationId);
}

// UPDATE — overwrite the view count for a publication.
async function setViewCount(publicationId, newCount) {
  const c = await connect();
  return c.zAdd(KEY, { score: newCount, value: publicationId });
}

// DELETE — remove a single publication from the ranking.
async function removePublication(publicationId) {
  const c = await connect();
  return c.zRem(KEY, publicationId);
}

// DELETE — drop the entire ranking key.
async function clearRanking() {
  const c = await connect();
  return c.del(KEY);
}

// RESET — flush the whole Redis database (test convenience).
async function flushAll() {
  const c = await connect();
  return c.flushAll();
}

module.exports = {
  KEY,
  addPublication,
  getTopN,
  getViewCount,
  getRank,
  getTotalCount,
  recordView,
  setViewCount,
  removePublication,
  clearRanking,
  flushAll,
};
