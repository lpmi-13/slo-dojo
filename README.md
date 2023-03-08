# SLO Dojo

The idea of SLIs and SLOs is fairly straightforward, and there's no shortage of blog posts and videos and articles explaining them.

What we need more of are hands-on activities to actually _do_ things with these concepts. So I made this repo to be a hands-on self-guided workshop looking at the metrics of a particular web application, and identifying and fixing 3 specific areas that are impacting the given SLOs (these will be visible in a grafana dashboard, and very clearly NOT meeting our set Service Level Objective targets).

## The challenges

-   The website is slow to load (latency is higher than our SLO)
-   The website is buggy (error rate for log-in is breaching our SLO)
-   The website takes a long time to return search results (the user journey for searching latency is higher than our SLO).

## Running it locally

So far, the only thing that happens is gets the server and database up and running locally. We can also start a (very) simple background load, all by running:

```
docker-compose up --build
```

and the API is now available at `localhost:3000` (eg, `localhost:3000/users` brings back all the current users in the database).

### Loading the data

We need a bunch of data in the database so that we can start to simulate realistic production workloads, so let's get some stuff in there!

1. Set up the tables (`sql-scripts/create-tables.sh`)

2. Put a bunch of sellers into the database via building the container in `/simple-insert-sellers`, and running `docker run -it --rm --network host simple-insert`.

3. Load up a bunch of products for these sellers via the `/simple-insert-products` container. This is a little funky, because we need to loop through the sellers and create products for them.

4. This is where it gets tricky...we want some purchases for the products we added, and the most straightforward way to connect customers to those purchases is to create the customers at the same time as the purchase (this is what the API will enable as well).

So we loop over the sellers, and grab a random number of products (between 2 and 10, for example). For each batch of purchases, we generate a new customer and enter them into the database. Using that customer's name, we pull out their ID to use later when inserting the purchase.

We only want each customer to purchase a product once (I guess in the real world they could do it multiple times, but this is simpler), so we have an empty slice to hold product IDs that the particular customer has already purchased. We generate random new product IDs until we have one that's not already been purchased by the customer and then we add that purchase, associated with the relevant customer, product, and seller.
