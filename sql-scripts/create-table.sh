#!/bin/bash

psql << EOF
\c api;

CREATE TABLE users (
  ID SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  email VARCHAR(30) NOT NULL
);

ALTER TABLE users
  OWNER TO $USER;

INSERT INTO users (name, email)
  VALUES ('Jerry', 'jerry@example.com'), ('George', 'george@example.com');

EOF