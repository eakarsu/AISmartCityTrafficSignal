# Operations

Provision least-privilege PostgreSQL, copy `.env.example`, replace credentials and set a random 32+ character JWT secret. Generate scrypt strings with `node scripts/hash-password.js 'a-long-password'` and provision roles out of band. Install dependencies explicitly and run `./scripts/migrate.sh`; `./start.sh` never installs, seeds, creates databases, kills ports or mutates schema.

Monitor telemetry gaps, controller delivery retries/dead letters, safety violations and rollback rate. A qualified operator must independently approve with a tested manual fallback. On uncertainty or loss of communications, keep/restore the controller-approved safe plan, enter recovery and reconcile controller receipts before close. This repository has not been field validated; AI routes are quarantined.
