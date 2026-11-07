-- Apply via Cloudflare D1 dashboard/CLI only after legal notice and configuration review.
-- This file does not create or charge for a database automatically.
CREATE TABLE IF NOT EXISTS inquiries (
 id TEXT PRIMARY KEY,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 company TEXT NOT NULL DEFAULT '',
 contact_name TEXT NOT NULL,
 contact_email TEXT NOT NULL,
 industry TEXT NOT NULL,
 details TEXT NOT NULL,
 budget TEXT NOT NULL,
 timing TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','quoted','closed')),
 owner_note TEXT NOT NULL DEFAULT '',
 version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1)
);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_expire ON inquiries(expires_at);
CREATE TABLE IF NOT EXISTS inbox_rate_limits (
 key_hash TEXT NOT NULL,
 bucket_hour INTEGER NOT NULL,
 hits INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY (key_hash,bucket_hour)
);
