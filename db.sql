DROP DATABASE IF EXISTS smartimmat;

CREATE DATABASE smartimmat;

use smartimmat;

CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    mail VARCHAR(100),
    password VARCHAR(256)
);

INSERT INTO
    user (nom, prenom, mail, password)
VALUES (
        "John",
        "Doe",
        "demo@example.com",
        "password123"
    )