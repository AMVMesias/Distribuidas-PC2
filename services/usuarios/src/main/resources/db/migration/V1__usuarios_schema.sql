CREATE TABLE personas (
    id_uuid uuid PRIMARY KEY,
    active boolean NOT NULL,
    address varchar(255),
    created_at timestamp NOT NULL,
    dni varchar(30) NOT NULL CONSTRAINT uk_personas_dni UNIQUE,
    email varchar(50) NOT NULL CONSTRAINT uk_personas_email UNIQUE,
    first_name varchar(30) NOT NULL,
    last_name varchar(30) NOT NULL,
    middle_name varchar(30),
    nationality varchar(30),
    phone varchar(15),
    updated_at timestamp NOT NULL
);

CREATE TABLE roles (
    id uuid PRIMARY KEY,
    active boolean NOT NULL,
    assigned_at timestamp NOT NULL,
    description text,
    name varchar(50) NOT NULL CONSTRAINT uk_roles_name UNIQUE,
    updated_at timestamp NOT NULL
);

CREATE TABLE users (
    id_person uuid PRIMARY KEY REFERENCES personas(id_uuid),
    active boolean NOT NULL,
    created_at timestamp NOT NULL,
    last_login timestamp,
    password_hash varchar(255) NOT NULL,
    updated_at timestamp NOT NULL,
    username varchar(15) NOT NULL CONSTRAINT uk_users_username UNIQUE
);

CREATE TABLE user_role (
    id_user uuid NOT NULL REFERENCES users(id_person),
    id_role uuid NOT NULL REFERENCES roles(id),
    active boolean NOT NULL,
    assigned_at timestamp NOT NULL,
    updated_at timestamp NOT NULL,
    PRIMARY KEY (id_user, id_role)
);

CREATE TABLE refresh_tokens (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id_person),
    family_id uuid NOT NULL,
    token_hash varchar(64) NOT NULL UNIQUE,
    issued_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    replaced_by_id uuid
);

CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
