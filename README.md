# SLO Dojo

SLO Dojo is a hands-on workshop for practicing SLI/SLO investigation on a small production-like web service.

The stack starts in a known bad state every time. Learners inspect the live service, metrics, dashboard, and code, then make changes until the SLO breach alerts clear.

## Workshop Goal

Resolve these three fixed SLO breaches:

- Homepage p95 latency is above `0.15s`.
- Login failure ratio is above `0.5%`.
- Search p95 latency is above `0.05s`.

The workshop intentionally uses the same three underlying problems on every reset. There is no separate randomized final scenario.

## Feedback Model

The system gives feedback only through SLO alert state:

- `HomepageLatencySLOBreach` clears when the homepage latency SLO is resolved.
- `LoginFailureSLOBreach` clears when the login success SLO is resolved.
- `SearchLatencySLOBreach` clears when the search latency SLO is resolved.
- `SLODojoComplete` fires when all three SLOs are resolved at the same time.

The dashboard and checker do not provide root-cause hints.

## Running Locally

Start from a clean seeded database:

```bash
./setup.sh
```

Or run the stack without deleting existing volumes:

```bash
docker compose up --build
```

Services:

- App: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:4000`
- Traefik dashboard: `http://localhost:8080`

The app image also runs a workload generator that continuously exercises the homepage, login, and search journeys.

## Useful Endpoints

- `GET /`
- `GET /customers`
- `GET /customers/:id`
- `POST /login`
- `GET /search?q=atlas`
- `POST /purchases`
- `POST /reviews`
- `POST /referrals`
- `PUT /referrals/:id/accept`
- `GET /metrics`

Seeded learner login users use emails from `learner01@example.com` through `learner40@example.com`.
The seeded password is `slo-dojo-password`.

## Checking SLO State

After the stack has been running for at least a minute:

```bash
npm run dojo:check
```

This reports only whether each SLO is still breached or resolved, plus whether all workshop SLOs are resolved together.

## Data

Database initialization creates deterministic workshop data:

- 500 sellers
- 12,040 customers
- 250,000 products
- 100,000 purchases
- 100,000 reviews
- 25,000 referrals

The schema and data are created by scripts in `sql-scripts/` when the Postgres volume is first initialized.
