-- liquibase formatted sql

-- changeset ayan:1
-- comment: Creating users, workspaces, departments, and categories tables with native Postgres UUID and JSONB
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    settings JSONB,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- rollback DROP TABLE knowledge_categories;
-- rollback DROP TABLE departments;
-- rollback DROP TABLE workspaces;
-- rollback DROP TABLE users;
-- rollback DROP EXTENSION IF EXISTS "uuid-ossp";
