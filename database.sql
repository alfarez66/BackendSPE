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


-- Create the new table to store the completeness scores
CREATE TABLE report_completeness (
    reportId SERIAL PRIMARY KEY,
    completeness_score FLOAT
);

-- Calculate and insert the completeness score for each report
INSERT INTO report_completeness (reportId, completeness_score)
SELECT reportId,
    (CASE
        WHEN description IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN status IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN image IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN location IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN assignee IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN date IS NOT NULL THEN 1 ELSE 0 END) / 6.0
FROM report;

-- Display the contents of the new completeness table
SELECT * FROM report_completeness;


-- version 2

-- Create the new table to store the completeness scores
CREATE TABLE report_completeness (
    reportId SERIAL PRIMARY KEY,
    date DATE,
    completeness_score FLOAT
);

-- Calculate and insert the completeness score for each report, and save it based on the date
INSERT INTO report_completeness (reportId, date, completeness_score)
SELECT reportId, date,
(CASE
        WHEN NULLIF(description, '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN NULLIF(status, '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN image IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN NULLIF(location, '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN NULLIF(assignee, '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE
        WHEN date IS NOT NULL THEN 1 ELSE 0 END) / 6.0
FROM report;

-- Display the contents of the new completeness table
SELECT * FROM report_completeness;


ALTER TABLE report
ADD COLUMN image_path VARCHAR(255);


