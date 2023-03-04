# Data Schema

In order to make the database do a bit more work and respond to load in more realistic ways, we need to give it a lot of relations. That way, it'll actually start to slow down a bit when the table sizes grow and load increases.

## Entities

-   User
-   Purchase
-   Seller (companies)
-   Product
-   Review
-   Referral

The users and the Sellers are probably the two main entities. Users buy things, review things, and refer their friends. Sellers sell things that get reviewed, and the sellers themselves are referred by users to other users.

### Users

-   ID (Primary Key)
-   Name
-   Email
-   Location

### Seller

-   ID (Primary Key)
-   Name
-   Location
-   Total successful referrals
-   Overall review rating (aggregrate of Reviews)

### Product

-   ID (Primary Key)
-   Name
-   Seller (Foreign Key to Seller ID)
-   Color (Foreign Key to Color ID)
-   Weight
-   SKU
-   Reviews (Foreign Key)

### Color (this is maybe overkill, but I'm havin fun!)

-   ID (Primary Key)
-   Name

### Purchase

-   ID (Primary Key)
-   Product (Foreign Key to Product ID)
-   Buyer (Foreign Key to User ID)
-   Seller (Foreign Key to Seller ID)
-   Date
-   Price
-   Currency
-   SKU

### Review

-   ID (Primary Key)
-   User (Foreign Key to User ID)
-   Product (Foreign Key to Product ID)
-   Date
-   ReviewText
-   Rating

### Referral

-   ID (Primary Key)
-   Seller (Foreign Key to Seller ID)
-   Referrer (Foreign Key to User ID)
-   Referree (Foreign Key to User ID)
-   Date
-   Accepted (Boolean)

## Types of things that happen

This section maps out what actually triggers updates to the database. This is going to map fairly 1:1 with the traffic that we're throwing at the application. These are all going to be separate endpoints and will have separate traffic loads pointed at them.

-   A person buys a product and reviews it. This is the most common type of event, and it's not very intensive. If the person already exists as a user, the review is added to their reviews, and if the person doesn't exist already, they get added along with their review. If the product exists already, this review is added to that product, and if the product doesn't exist already, then the product is added along with the review.

-   A person refers a company. This is the second most common type of event, also very low-footprint. If the person exists, and the company exists, and the person they're referring all exist, then the referral is added, and all the other entities are just part of that referral. If any of those things don't exist, then they're added to the database in the relevant tables.

-   A person accepts a referral from a friend. This is frequent, but by no means as frequent as people referring. This changes the Referall to Accepted:True and updates the Seller's total accepted referrals.

-   A person updates a review. This doesn't happen very frequently, but sometimes people realize they wrote the wrong thing and want to change it. They can either change an existing review text or review rating. This will have a cascading effect on the seller's overall review rating.

-   A review is deleted. This happens every so often. Spammers put fake reviews up, either to skew a brand's rating or to advertise their own products, and so we need to remove these. This also has a cascading effect on the overall review rating for a seller.

-   A person reads a review. This is very common, and is just a straight GET request to the Review endpoint.

-   A company wants to load a bunch of products. They just signed up with the platform and they want to make sure all their products are available to be annotated with reviews and referrals. This data is usually batch inserted, so it would be a call to an endpoint to batch load products for a specific seller. It could also be that the company already has reviews and referrals on those products, so sometimes those also get batch inserted when adding products.

-   A company wants to load a bunch of reviews. They signed up with the platform and want all their review data to come with them. This usually happens alongside uploading a bunch of products, but not necessarily. It's a separate endpoint, since they might have merged with another company selling the same product (for our purposes) and now they want the reviews for the other company's product to also be their reviews.
