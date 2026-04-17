# CS3200 Project 3 — Redis In-Memory Store

**Authors:** Neel Vinay, Krishna Raheja
**Course:** CS3200 — Database Design
**Semester:** Spring 2026

This project adds a Redis in-memory layer to our **Academic Contribution
Registry** system (originally built in Project 1 with SQLite, then
re-implemented in Project 2 with MongoDB). The Redis layer tracks the
**most-viewed publications** in real time using a Redis sorted set.

- Project 1 (SQLite): <https://github.com/NeelVinay/cs3200project1>
- Project 2 (MongoDB): <https://github.com/NeelVinay/cs3200project2>
- Project 3 (Redis, this repo): <https://github.com/NeelVinay/cs3200project3>
- **Video demo:** _TBD — link added before final submission_
- **Requirements PDF:** [`requirements.pdf`](./requirements.pdf)
- **UML conceptual model:** [`AcademicContributionRegistry_UML.png`](./AcademicContributionRegistry_UML.png)

We implemented **Task 5** (Node script, 10 pts) — not the Express/web-UI
alternative (Task 4).

---

## Why Redis for this functionality?

Projects 1 and 2 store the full registry (Researchers, Publications,
Roles, Contributions, Topics) in durable databases. Both struggle with
one specific query pattern: **real-time ranked lookups of the
most-viewed publications.** In SQLite this needs an `ORDER BY COUNT(*)`
over a view-log table; in MongoDB it needs an aggregation pipeline.
Neither is a natural fit for an O(log N) "top-N" lookup that may be
requested thousands of times per second on a trending-publications
dashboard.

Redis is a better fit for this hot-path query because:

- `ZINCRBY` gives atomic, lock-free view-count increments.
- `ZREVRANGE` returns top-N already sorted in O(log N + M).
- `ZREVRANK` and `ZSCORE` answer single-publication questions in
  near-constant time.
- The `mostViewed:<scope>` keyspace extends trivially to per-user or
  per-topic rankings without code changes.

Redis **does not replace** SQLite or MongoDB — those remain the system
of record. Redis is a cacheable, rebuildable overlay for one query.

---

## Data structure

| Field  | Value                                            |
| ------ | ------------------------------------------------ |
| Type   | Redis Sorted Set (ZSET)                          |
| Key    | `mostViewed:global`                              |
| Member | Publication ID (e.g. `pub_001`)                  |
| Score  | Integer view count                               |

---

## Redis commands — full CRUD

All commands below operate on `mostViewed:global`. They're shown in
raw `redis-cli` form; the Node code in [`src/mostViewed.js`](src/mostViewed.js)
wraps each one in a named function.

### Initialize / reset

```
FLUSHALL
```

### Create — add a publication to the ranking

```
ZADD mostViewed:global 42 pub_001
```

### Read — top-N most-viewed publications

```
ZREVRANGE mostViewed:global 0 4 WITHSCORES
```

### Read — view count for one publication

```
ZSCORE mostViewed:global pub_002
```

### Read — rank of one publication (0 = top)

```
ZREVRANK mostViewed:global pub_002
```

### Read — total number of publications tracked

```
ZCARD mostViewed:global
```

### Update — record one new view (atomic)

```
ZINCRBY mostViewed:global 1 pub_004
```

### Update — overwrite an exact view count

```
ZADD mostViewed:global 500 pub_008
```

### Delete — remove one publication

```
ZREM mostViewed:global pub_999
```

### Delete — drop the entire ranking key

```
DEL mostViewed:global
```

---

## Project layout

```
CS3200_Project3/
├── data/
│   └── publications.json        # Seed data (8 sample publications)
├── scripts/
│   └── seed.js                  # Wipes Redis and loads seed data
├── src/
│   ├── redisClient.js           # Shared Redis connection
│   ├── mostViewed.js            # All CRUD ops on the sorted set
│   └── demo.js                  # Exercises every CRUD op end-to-end
├── requirements.pdf             # Business requirements document
├── AcademicContributionRegistry_UML.png   # UML conceptual model
├── package.json
└── README.md
```

---

## How to run

### Prerequisites

- Node.js 18 or later
- Redis server running on `127.0.0.1:6379`

---

#### macOS

```bash
brew install redis
brew services start redis
redis-cli ping          # expect: PONG
```

---

#### Windows (Docker)

1. Make sure Docker Desktop is installed and running.
2. Start a Redis container (maps Redis's default port 6379 to your machine):
   ```bash
   docker run -d -p 6379:6379 --name redis redis
   ```
3. Verify Redis is reachable:
   ```bash
   docker exec -it redis redis-cli ping
   # expect: PONG
   ```
4. To stop Redis when you're done:
   ```bash
   docker stop redis
   ```
5. To restart it later without recreating it:
   ```bash
   docker start redis
   ```

> **Note:** If you already have a Redis container running from Docker Desktop, skip step 2 — just make sure port 6379 is mapped.

---

### 1. Install dependencies

```bash
npm install
```

### 2. Seed Redis with the sample data

```bash
npm run seed
```

### 3. Run the CRUD demo

```bash
npm run demo
```

The demo:

1. Prints the top-5 most-viewed publications.
2. Looks up a single publication's score, rank, and the total count.
3. Records 3 views on `pub_004` via `ZINCRBY`.
4. Overwrites `pub_008` to exactly 500 views via `ZADD`.
5. Creates a new publication `pub_999`.
6. Prints the updated top-5.
7. Deletes `pub_999` via `ZREM` and confirms it's gone.

---

## AI disclosure

AI tools (including Claude Code) were used during the preparation of
this project for planning the Redis data-structure choice, scaffolding
boilerplate Node.js code, and drafting portions of this README and the
requirements document. All design decisions, final code, and testing
against a live Redis instance were reviewed, edited, and verified by
the authors (Neel Vinay and Krishna Raheja). No AI tool is listed as
a contributor or co-author on any submitted artifact.
