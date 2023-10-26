CREATE DATABASE SPE;

CREATE TABLE report (
    reportId SERIAL PRIMARY KEY,
    userId INT NOT NULL,
    date TIMESTAMP NOT NULL,
    description VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    image BYTEA,
    location VARCHAR(255) NOT NULL,
    assignee VARCHAR(255) NOT NULL
);


CREATE TABLE report (
    reportId SERIAL PRIMARY KEY,
    userId INT,
    date TIMESTAMP,
    description VARCHAR(255),
    status VARCHAR(255),
    image BYTEA,
    location VARCHAR(255),
    assignee VARCHAR(255)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    access VARCHAR(50) CHECK (access IN ('Guest', 'User', 'Admin','Manager')),
    date TIMESTAMP
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    contact VARCHAR(15),
    password VARCHAR(255),
    access VARCHAR(50),
    date TIMESTAMP
);