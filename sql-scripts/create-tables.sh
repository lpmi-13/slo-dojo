#!/bin/bash
set -euo pipefail

psql << EOF
\c api;

CREATE TABLE customers (
  customer_id INT GENERATED ALWAYS AS IDENTITY,
  customer_name VARCHAR(80) NOT NULL,
  customer_email VARCHAR(120) NOT NULL,
  customer_location VARCHAR(80) NOT NULL,
  password_hash CHAR(64) NOT NULL,
  PRIMARY KEY(customer_id),
  CONSTRAINT customers_email_unique UNIQUE(customer_email)
);

CREATE TABLE sellers (
  seller_id INT GENERATED ALWAYS AS IDENTITY,
  seller_name VARCHAR(80) NOT NULL,
  seller_location VARCHAR(80) NOT NULL,
  total_successful_referrals INT NOT NULL DEFAULT 0,
  overall_review_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY(seller_id)
);

CREATE TABLE colors (
  color_id INT GENERATED ALWAYS AS IDENTITY,
  color_name VARCHAR(20) NOT NULL,
  PRIMARY KEY(color_id)
);

CREATE TABLE products (
  product_id INT GENERATED ALWAYS AS IDENTITY,
  product_name VARCHAR(120) NOT NULL,
  weight INT NOT NULL,
  sku VARCHAR(80) NOT NULL,
  seller_id INT NOT NULL,
  color_id INT NOT NULL,
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
   customer_id INT NOT NULL,
   seller_id INT NOT NULL,
   product_id INT NOT NULL,
   date DATE NOT NULL,
   price INT NOT NULL,
   currency VARCHAR(3) NOT NULL,
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
  reviewer_id INT NOT NULL,
  product_id INT NOT NULL,
  purchase_id INT NOT NULL,
  review_date DATE NOT NULL,
  review_text VARCHAR(1000) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
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
  seller_id INT NOT NULL,
  referrer_id INT NOT NULL,
  referree_id INT NOT NULL,
  referral_offer_date DATE NOT NULL,
  referral_accepted BOOLEAN NOT NULL DEFAULT false,
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

ALTER TABLE customers OWNER TO $USER;
ALTER TABLE sellers OWNER TO $USER;
ALTER TABLE colors OWNER TO $USER;
ALTER TABLE products OWNER TO $USER;
ALTER TABLE purchases OWNER TO $USER;
ALTER TABLE reviews OWNER TO $USER;
ALTER TABLE referrals OWNER TO $USER;

CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_color_id ON products(color_id);
CREATE INDEX idx_purchases_customer_id ON purchases(customer_id);
CREATE INDEX idx_purchases_seller_id ON purchases(seller_id);
CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_referrals_seller_id ON referrals(seller_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referree_id ON referrals(referree_id);

INSERT INTO colors (color_name)
VALUES
  ('red'),
  ('blue'),
  ('orange'),
  ('pink'),
  ('black'),
  ('white'),
  ('teal'),
  ('purple'),
  ('yellow'),
  ('green');
EOF
