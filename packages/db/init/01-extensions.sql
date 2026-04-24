-- Required by the schema (citext columns for handles/tags/emails).
-- Runs automatically when the postgres container starts on an empty volume.
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
