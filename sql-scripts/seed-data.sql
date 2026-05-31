\c api;

INSERT INTO sellers (
  seller_name,
  seller_location,
  total_successful_referrals,
  overall_review_rating
)
SELECT
  'seller-' || seller_number,
  (ARRAY['London', 'Manchester', 'Cardiff', 'Edinburgh', 'Belfast'])[
    1 + (seller_number % 5)
  ],
  0,
  0
FROM generate_series(1, 500) AS seller_number;

INSERT INTO customers (
  customer_name,
  customer_email,
  customer_location,
  password_hash
)
SELECT
  'Learner ' || LPAD(learner_number::text, 2, '0'),
  'learner' || LPAD(learner_number::text, 2, '0') || '@example.com',
  (ARRAY['London', 'Manchester', 'Cardiff', 'Edinburgh', 'Belfast'])[
    1 + (learner_number % 5)
  ],
  'a0f07c416a189d1535ade6fb85b58c9e9887fad975a1533fd1fb97d6cbd9daaf'
FROM generate_series(1, 40) AS learner_number;

INSERT INTO customers (
  customer_name,
  customer_email,
  customer_location,
  password_hash
)
SELECT
  'Customer ' || customer_number,
  'customer' || customer_number || '@example.com',
  (ARRAY['London', 'Manchester', 'Cardiff', 'Edinburgh', 'Belfast'])[
    1 + (customer_number % 5)
  ],
  'a0f07c416a189d1535ade6fb85b58c9e9887fad975a1533fd1fb97d6cbd9daaf'
FROM generate_series(1, 12000) AS customer_number;

INSERT INTO products (
  product_name,
  weight,
  sku,
  seller_id,
  color_id
)
SELECT
  product_terms.term || '-' || product_number,
  1 + (product_number % 100),
  'SKU-' || product_number,
  1 + ((product_number - 1) % 500),
  1 + ((product_number - 1) % 10)
FROM generate_series(1, 250000) AS product_number
CROSS JOIN LATERAL (
  SELECT (ARRAY[
    'atlas',
    'bravo',
    'cinder',
    'delta',
    'ember',
    'fable',
    'glimmer',
    'harbor',
    'ion',
    'juno'
  ])[1 + (product_number % 10)] AS term
) AS product_terms;

INSERT INTO purchases (
  customer_id,
  seller_id,
  product_id,
  date,
  price,
  currency
)
SELECT
  1 + ((purchase_number - 1) % 12040),
  1 + ((((purchase_number * 17) % 250000)) % 500),
  1 + ((purchase_number * 17) % 250000),
  DATE '2026-01-01' + ((purchase_number % 120)::int),
  5 + (purchase_number % 500),
  'GBP'
FROM generate_series(1, 100000) AS purchase_number;

INSERT INTO reviews (
  reviewer_id,
  product_id,
  purchase_id,
  review_date,
  review_text,
  rating
)
SELECT
  customer_id,
  product_id,
  purchase_id,
  date + 1,
  'Seeded review for product ' || product_id,
  1 + (purchase_id % 5)
FROM purchases;

INSERT INTO referrals (
  seller_id,
  referrer_id,
  referree_id,
  referral_offer_date,
  referral_accepted
)
SELECT
  1 + ((referral_number - 1) % 500),
  1 + ((referral_number * 3) % 12040),
  1 + ((referral_number * 7) % 12040),
  DATE '2026-01-01' + ((referral_number % 90)::int),
  referral_number % 3 = 0
FROM generate_series(1, 25000) AS referral_number;

UPDATE sellers
SET
  total_successful_referrals = referral_counts.accepted_count,
  overall_review_rating = review_counts.average_rating
FROM (
  SELECT seller_id, COUNT(*)::int AS accepted_count
  FROM referrals
  WHERE referral_accepted = true
  GROUP BY seller_id
) AS referral_counts
JOIN (
  SELECT p.seller_id, ROUND(AVG(r.rating)::numeric, 2) AS average_rating
  FROM reviews r
  JOIN products p ON p.product_id = r.product_id
  GROUP BY p.seller_id
) AS review_counts ON review_counts.seller_id = referral_counts.seller_id
WHERE sellers.seller_id = referral_counts.seller_id;

ANALYZE;
