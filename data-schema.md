# Data Schema

In order to make the database do a bit more work and respond to load in more realistic ways, we need to give it a lot of relations. That way, it'll actually start to slow down a bit when the table sizes grow and load increases.

## Entities

- User
- Purchase
- Seller (companies)
- Product
- Review
- Referral

### Users

- ID (Primary Key)
- Name
- Email
- Location
- Purchases (Foreign Key) 
- Reviews (Foreign Key)
- Referrals (Foreign Key)


### Purchase

- ID (Primary Key)
- Product (Foreign Key)
- Buyer (Foreign Key to User)
- Seller (Foreign Key)
- Date
- Price
- Currency
- SKU
- Reviews (Foreign Key)


### Seller

- ID (Primary Key)
- Name
- Products (Foreign Key)
- Location
- Referrals (Foreign Key)


### Product

- ID (Primary Key)
- Name
- Seller (Foreign Key)
- Currency
- Price
- Color
- Weight
- SKU
- Reviews (Foreign Key)


### Review

- ID (Primary Key)
- User (Foreign Key)
- Product (Foreign Key)
- Date
- ReviewText
- Rating


### Referral

- ID (Primary Key)
- Seller (Foreign Key)
- Referrer (Foreign Key to User)
- Referree (Foreign Key to User)
- Date
- Accepted (Boolean)
