-- Active: 1761561529938@@127.0.0.1@3306@smartimmat
DROP DATABASE IF EXISTS smartimmat;

CREATE DATABASE smartimmat;

use smartimmat;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(256)
);

CREATE TABLE files(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100),
    size VARCHAR(100),
    extension VARCHAR(20)

)

INSERT INTO
    users (nom, prenom, email, password)
VALUES (
        "John",
        "Doe",
        "demo@example.com",
        "password123"
    )

