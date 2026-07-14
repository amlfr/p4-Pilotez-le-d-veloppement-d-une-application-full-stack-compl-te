-- Tables de Datashare : psql -U postgres -d datashare -f db/02-schema.sql
-- L'appli boote en ddl-auto=validate — schéma manquant = démarrage refusé.

-- Comptes (mot de passe haché BCrypt).
CREATE TABLE users (
    id       uuid                   NOT NULL,
    email    character varying(255) NOT NULL,
    name     character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    CONSTRAINT users_pkey     PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Métadonnées des fichiers ; les octets vivent sur disque sous stored_name.
-- user_id null = upload anonyme (US07).
CREATE TABLE files (
    id              uuid                        NOT NULL,
    content_type    character varying(255)      NOT NULL,
    download_token  uuid                        NOT NULL,
    expiration_date timestamp(6) with time zone NOT NULL,
    original_name   character varying(255)      NOT NULL,
    password        character varying(255),
    size_bytes      bigint                      NOT NULL,
    stored_name     character varying(255)      NOT NULL,
    upload_date     timestamp(6) with time zone NOT NULL,
    user_id         uuid,
    CONSTRAINT files_pkey              PRIMARY KEY (id),
    CONSTRAINT uq_files_download_token UNIQUE (download_token),
    CONSTRAINT uq_files_stored_name    UNIQUE (stored_name),
    CONSTRAINT fk_files_user           FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Tags (US08) — côté JPA, la @ElementCollection de StoredFile.
CREATE TABLE file_tags (
    file_id uuid NOT NULL,
    tag     character varying(30),
    CONSTRAINT fk_file_tags_file FOREIGN KEY (file_id) REFERENCES files (id)
);
