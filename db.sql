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

INSERT INTO
    users (nom, prenom, email, password)
VALUES (
        "John",
        "Doe",
        "demo@example.com",
        "password123"
    )

