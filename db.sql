-- Active: 1761561529938@@127.0.0.1@3306@smartimmat
-- SmartImmat database schema
-- Includes users, files storage (disk or blob), and per-user file history

DROP DATABASE IF EXISTS smartimmat;
CREATE DATABASE smartimmat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartimmat;

-- Users table
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Files table: stores metadata; supports either disk storage (storage_path) or DB blob (content)
CREATE TABLE files (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  extension VARCHAR(20),
  mimetype VARCHAR(100),
  size_bytes BIGINT UNSIGNED,
  storage_path VARCHAR(500), -- if you save files on disk (recommended in prod)
  content LONGBLOB,          -- if you choose to store file bytes in DB
  checksum_sha256 CHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_files_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_files_user_id (user_id),
  INDEX idx_files_created_at (created_at)
) ENGINE=InnoDB;

-- File history: logs user actions on files (upload, download, delete, etc.)
CREATE TABLE file_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  file_id BIGINT UNSIGNED NOT NULL,
  action ENUM('UPLOAD','DOWNLOAD','DELETE','VIEW','UPDATE') NOT NULL,
  details VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_fh_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_fh_user_id (user_id),
  INDEX idx_fh_file_id (file_id),
  INDEX idx_fh_created_at (created_at)
) ENGINE=InnoDB;

-- Seed demo user
INSERT INTO users (nom, prenom, email, password)
VALUES ('John', 'Doe', 'demo@example.com', 'password123');

