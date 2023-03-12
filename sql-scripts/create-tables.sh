#!/bin/bash

psql << EOF
\c api;

CREATE TABLE customers (
  customer_id INT GENERATED ALWAYS AS IDENTITY,
  customer_name VARCHAR(60) NOT NULL,
  customer_email VARCHAR(60) NOT NULL,
  customer_location VARCHAR(60) NOT NULL,
  PRIMARY KEY(customer_id)
);

CREATE TABLE sellers (
  seller_id INT GENERATED ALWAYS AS IDENTITY,
  seller_name VARCHAR(50),
  seller_location VARCHAR(60),
  total_successful_referrals INT,
  overall_review_rating INT,
  PRIMARY KEY(seller_id)
);

CREATE TABLE colors (
  color_id INT GENERATED ALWAYS AS IDENTITY,
  color_name VARCHAR(10),
  PRIMARY KEY(color_id)
);

CREATE TABLE products (
  product_id INT GENERATED ALWAYS AS IDENTITY,
  product_name VARCHAR(60),
  weight INT,
  sku VARCHAR(60),
  seller_id INT,
  color_id INT,
  PRIMARY KEY(product_id),
  CONSTRAINT fk_seller
    FOREIGN KEY(seller_id)
      REFERENCES sellers(seller_id),
  CONSTRAINT fk_color
    FOREIGN KEY(color_id)
      REFERENCES colors(color_id)
);

CREATE TABLE purchases (
   purchase_id INT GENERATED ALWAYS AS IDENTITY,
   customer_id INT,
   seller_id INT,
   product_id INT,
   date DATE,
   price INT,
   currency VARCHAR(3),
   PRIMARY KEY(purchase_id),
   CONSTRAINT fk_customer
      FOREIGN KEY(customer_id)
	      REFERENCES customers(customer_id),
   CONSTRAINT fk_seller
      FOREIGN KEY(seller_id)
        REFERENCES sellers(seller_id),
   CONSTRAINT fk_product
      FOREIGN KEY(product_id)
        REFERENCES products(product_id)
);

CREATE TABLE reviews (
  review_id INT GENERATED ALWAYS AS IDENTITY,
  reviewer_id INT,
  product_id INT,
  purchase_id INT,
  review_date DATE,
  review_text VARCHAR(1000),
  rating INT,
  PRIMARY KEY(review_id),
  CONSTRAINT fk_reviewer
    FOREIGN KEY(reviewer_id)
      REFERENCES customers(customer_id),
  CONSTRAINT fk_product
    FOREIGN KEY(product_id)
      REFERENCES products(product_id),
  CONSTRAINT fk_purchase
    FOREIGN KEY(purchase_id)
      REFERENCES purchases(purchase_id)
);

CREATE TABLE referrals (
  referral_id INT GENERATED ALWAYS AS IDENTITY,
  seller_id INT,
  referrer_id INT,
  referree_id INT,
  referral_offer_data DATE,
  referral_accepted BOOLEAN NOT NULL,
  PRIMARY KEY(referral_id),
  CONSTRAINT fk_seller
    FOREIGN KEY(seller_id)
      REFERENCES sellers(seller_id),
  CONSTRAINT fk_referrer
    FOREIGN KEY(referrer_id)
      REFERENCES customers(customer_id),
  CONSTRAINT fk_referree
    FOREIGN KEY(referree_id)
      REFERENCES customers(customer_id)
);

ALTER TABLE customers
  OWNER TO $USER;

ALTER TABLE sellers
  OWNER TO $USER;

ALTER TABLE colors
  OWNER TO $USER;

ALTER TABLE products
  OWNER TO $USER;

ALTER TABLE purchases
  OWNER TO $USER;

ALTER TABLE reviews
  OWNER TO $USER;

ALTER TABLE referrals
  OWNER TO $USER;

/*
left here as an example
INSERT INTO customers (customer_name, customer_email, customer_location)
  VALUES ('Jerry', 'jerry@example.com', 'Scotland'), ('George', 'george@example.com', 'Georgia');
*/

/*
left here as an example
INSERT INTO sellers(seller_name, seller_location, total_successful_referrals, overall_review_rating)
  VALUES ('Cars Galore', 'West Northton', 0, 0), ('Big Sally''s', 'Town Scamban', 0, 0), ('Tiny Teapots', 'East Westmenshire', 0, 0);
*/

INSERT INTO colors (color_name)
    VALUES ('red'), ('blue'), ('orange'), ('pink'), ('black'), ('white'), ('teal'), ('purple'), ('yellow'), ('green');

/*
left here as an example
INSERT INTO products (product_name, weight, sku, seller_id, color_id )
  VALUES ('milk steak', '24.2', '4jdfuf78fu4j', (SELECT seller_id FROM sellers WHERE seller_name = 'Cars Galore'), (SELECT color_id FROM colors WHERE color_name = 'blue')),
         ('beef steak', '5', '3j3j3uudfj', (SELECT seller_id FROM sellers WHERE seller_name = 'Big Sally''s'), (SELECT color_id FROM colors WHERE color_name = 'green')),
         ('the tiniest teapot', '3.44', '3jj3j3u3syfdydf', (SELECT seller_id FROM sellers WHERE seller_name = 'Tiny Teapots'), (SELECT color_id FROM colors WHERE color_name = 'teal'));
*/

/*
left here as an example
INSERT INTO purchases (customer_id, seller_id, product_id, date, price, currency)
    VALUES ((SELECT customer_id FROM customers WHERE customer_name = 'Jerry'), (SELECT seller_id FROM sellers WHERE seller_name = 'Tiny Teapots'), (SELECT product_id FROM products WHERE product_name = 'the tiniest teapot'), '2022-02-10', '15.25', 'GBP'),
      ((SELECT customer_id FROM customers WHERE customer_name = 'George'), (SELECT seller_id FROM sellers WHERE seller_name = 'Big Sally''s'), (SELECT product_id FROM products WHERE product_name = 'beef steak'), '2023-01-22', '24.00', 'USD');
*/

EOF