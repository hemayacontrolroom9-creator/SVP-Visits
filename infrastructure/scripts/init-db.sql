-- PostgreSQL initialization script
-- This runs when the Docker container first starts

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set timezone
SET timezone = 'UTC';

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

COMMENT ON DATABASE supervisor_visits IS 'Supervisor Visit Management System Database';
