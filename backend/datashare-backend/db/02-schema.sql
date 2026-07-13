-- Datashare — étape 2/2 : création du schéma (tables, contraintes).
-- À exécuter sur la base créée à l'étape 1 :
--   psql -U postgres -d datashare -f db/02-schema.sql
--
-- Le schéma doit rester aligné avec les entités JPA (com.datashare.entity) :
-- l'application démarre en spring.jpa.hibernate.ddl-auto=validate et refuse
-- de se lancer si une table ou une colonne manque.

-- Comptes utilisateurs (US01). Mot de passe stocké haché (BCrypt).
CREATE TABLE users (
    id       uuid                   NOT NULL,
    email    character varying(255) NOT NULL,
    name     character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    CONSTRAINT users_pkey     PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Métadonnées des fichiers partagés ; les octets vivent sur disque sous
-- stored_name. user_id nullable : upload anonyme (US07).
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

-- Tags d'un fichier (US08) — table de collection JPA (@ElementCollection).
CREATE TABLE file_tags (
    file_id uuid NOT NULL,
    tag     character varying(30),
    CONSTRAINT fk_file_tags_file FOREIGN KEY (file_id) REFERENCES files (id)
);
