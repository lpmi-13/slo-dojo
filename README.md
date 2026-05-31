# SLO Dojo

SLO Dojo is a hands-on workshop for practicing SLI/SLO investigation on a small production-like web service.

The stack starts in a known bad state every time. Learners inspect the live service, metrics, dashboard, and code, then make changes until the SLO breach alerts clear.

![SLOs breached in the simulation](images/slos_breaches.png)

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

When the app is up, open `http://localhost:3000/alerts` and click **Allow notifications**.
Then open Grafana in another tab at `http://localhost:4000`. It is your first day on call for this service, but don't worry, surely nothing can go wrong...

After the workload has been running for about a minute, Prometheus sends the SLO breach alerts to Alertmanager, and Alertmanager sends them to the browser tab. Keep the tab open while you work so it can also notify you when alerts resolve.

Or run the stack without deleting existing volumes:

```bash
docker compose up --build
```

Services:

- App: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
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
- `GET /alerts`

Seeded learner login users use emails from `learner01@example.com` through `learner40@example.com`.
The seeded password is `slo-dojo-password`.

## Checking SLO State

After the stack has been running for at least a minute:

```bash
npm run dojo:check
```

This reports only whether each SLO is still breached or resolved, plus whether all workshop SLOs are resolved together.

## Fixing The Service

Learners are expected to edit the source code in this repository directly. This is intentional: the dojo is designed for an ephemeral local environment, and the repository can always be reset with version control after a run.

After changing app code, redeploy the app container from the current local source tree:

```bash
./scripts/redeploy-app.sh
```

This rebuilds and restarts only the app service. The database, Prometheus, Alertmanager, Grafana, and workload keep running, so the alert state should update after the next metric window.

Database changes that affect seeded schema files only apply to a fresh database volume. For live fixes such as adding an index, apply the change to the running database rather than resetting the whole stack.

## Alerting

Prometheus evaluates the SLO rules in `prometheus/rules.yml`, sends alerts to Alertmanager, and Alertmanager sends the default notification webhook to `POST /alertmanager` in the app.

The default receiver is local browser notifications through `http://localhost:3000/alerts`. Browser notifications require the tab to stay open and require the learner to click **Allow notifications** once.

External notification services are not enabled by default. An example config is available at `alertmanager/external-example.yml` with receiver blocks for Discord, Pushover, and PagerDuty. To use one, copy the relevant receiver and route into `alertmanager/alertmanager.yml`, add real service credentials, and restart Alertmanager.

Alertmanager supports additional receivers, including email, Slack, Opsgenie, Telegram, and generic webhooks. See the official Alertmanager configuration docs: https://prometheus.io/docs/alerting/latest/configuration/

## Data

Database initialization creates deterministic workshop data:

- 500 sellers
- 12,040 customers
- 250,000 products
- 100,000 purchases
- 100,000 reviews
- 25,000 referrals

The schema and data are created by scripts in `sql-scripts/` when the Postgres volume is first initialized.
