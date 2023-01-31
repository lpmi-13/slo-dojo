# SLO Dojo

The idea of SLIs and SLOs is fairly straightforward, and there's no shortage of blog posts and videos and articles explaining them.

What we need more of are hands-on activities to actually _do_ things with these concepts. So I made this repo to be a hands-on self-guided workshop looking at the metrics of a particular web application, and identifying and fixing 3 specific areas that are impacting the given SLOs (these will be visible in a grafana dashboard, and very clearly NOT meeting our set Service Level Objective targets).

## The challenges

- The website is slow to load (latency is higher than our SLO)
- The website is buggy (error rate for log-in is breaching our SLO)
- The website takes a long time to return search results (the user journey for searching latency is higher than our SLO).

## Running it locally

So far, the only thing that happens is gets the server and database up and running locally. We can also start a (very) simple background load, all by running:

```
docker-compose up --build
```

and the API is now available at `localhost:3000` (eg, `localhost:3000/users` brings back all the current users in the database).
