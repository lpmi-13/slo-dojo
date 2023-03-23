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

1. Set up the tables (`sql-scripts/create-tables.sh`), which gets run when the postgres container starts.

2. Put a bunch of data in the database, and for now we can just run `./setup.sh`, which goes through the "simple-insert" directories and runs the inserts. At some point, these will probably all be unified, but they work now and are fast enough, so I'll leave them for later.

### Ramping up the load

Now that we have data in our database we can start loading up the database with more realistic I/O requests.

-   Getting a random customer by ID

`GET /customers/:id`

-   Adding batch purchase (this is going to model some backfills of sellers wanting to add historical data)

`POST /purchases`

-   Adding a review (this might also have a batch endpoint)

`POST /review`

-   Adding a referral offer (meaning not yet accepted)

`POST /referral`

-   Updating a referral when the offer is accepted (sets accepted to true, basically)

`PUT /referral`
