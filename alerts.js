const clients = new Set();
const history = [];
const maxHistory = 100;
const defaultGrafanaHealthUrl = "http://grafana:3000/api/health";

function alertPage(request, response) {
    response.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SLO Dojo On-Call</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #101418;
      color: #eef4f7;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        linear-gradient(135deg, rgba(22, 94, 125, 0.28), transparent 42%),
        linear-gradient(315deg, rgba(160, 58, 58, 0.18), transparent 38%),
        #101418;
    }

    main {
      width: min(860px, calc(100vw - 32px));
      padding: 32px;
    }

    h1 {
      margin: 0 0 12px;
      font-size: 32px;
      letter-spacing: 0;
    }

    p {
      max-width: 720px;
      line-height: 1.6;
      color: #c9d6dc;
    }

    .muted {
      color: #9db0b8;
      font-weight: 700;
    }

    a {
      color: #f6ce73;
      font-weight: 700;
      text-decoration-thickness: 2px;
      text-underline-offset: 3px;
    }

    a:hover {
      color: #ffe09a;
    }

    a:focus-visible {
      outline: 2px solid #f0b84f;
      outline-offset: 3px;
      border-radius: 3px;
    }

    button {
      appearance: none;
      border: 0;
      border-radius: 6px;
      padding: 12px 16px;
      margin: 8px 0 24px;
      background: #f0b84f;
      color: #17130a;
      font-weight: 700;
      cursor: pointer;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px;
      color: #dbe8ed;
      background: rgba(255, 255, 255, 0.06);
    }

    .feed {
      display: grid;
      gap: 10px;
      margin-top: 24px;
    }

    .event {
      border-left: 4px solid #f0b84f;
      border-radius: 6px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.08);
    }

    .event.resolved {
      border-left-color: #6bd17f;
    }

    .event.firing {
      border-left-color: #ff6b66;
    }

    .event strong {
      display: block;
      margin-bottom: 4px;
    }

    .event span {
      color: #b9c7cd;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <main>
    <h1>SLO Dojo On-Call</h1>
    <p>
      Go ahead and click allow notifications, then
      <span id="grafana-waiting" class="muted">wait for Grafana to start</span><a id="grafana-link" href="http://localhost:4000" target="_blank" rel="noopener noreferrer" aria-label="Open the Grafana dashboard in a new tab" hidden>open the Grafana tab</a>.
    </p>
    <p>
      It is your first day on call for this service, but don't worry,
      surely nothing can go wrong...
    </p>
    <button id="allow">Allow notifications</button>
    <div class="status" id="status">Connecting to Alertmanager webhook events...</div>
    <div class="feed" id="feed"></div>
  </main>

  <script>
    const allowButton = document.querySelector("#allow");
    const grafanaLink = document.querySelector("#grafana-link");
    const grafanaWaiting = document.querySelector("#grafana-waiting");
    const statusNode = document.querySelector("#status");
    const feedNode = document.querySelector("#feed");
    const firingAlerts = new Set();
    const seen = new Set();

    const grafanaUrl = new URL(window.location.href);
    grafanaUrl.port = "4000";
    grafanaUrl.pathname = "/";
    grafanaUrl.search = "";
    grafanaUrl.hash = "";
    grafanaLink.href = grafanaUrl.toString();

    async function checkGrafanaReady() {
      try {
        const response = await fetch("/grafana/health", {
          cache: "no-store",
        });

        if (response.ok) {
          grafanaWaiting.hidden = true;
          grafanaLink.hidden = false;
          return;
        }
      } catch (error) {
      }

      grafanaWaiting.hidden = false;
      grafanaLink.hidden = true;
      window.setTimeout(checkGrafanaReady, 2000);
    }

    function setStatus(message) {
      statusNode.textContent = message;
    }

    function notificationPermission() {
      if (!("Notification" in window)) {
        allowButton.disabled = true;
        setStatus("This browser does not support desktop notifications.");
        return;
      }

      if (Notification.permission === "granted") {
        allowButton.disabled = true;
        allowButton.textContent = "Notifications enabled";
      } else if (Notification.permission === "denied") {
        allowButton.disabled = true;
        allowButton.textContent = "Notifications blocked";
      }
    }

    function renderEvent(event) {
      if (seen.has(event.id)) {
        return;
      }

      seen.add(event.id);
      const element = document.createElement("div");
      const title = document.createElement("strong");
      const body = document.createElement("span");

      element.className = "event " + event.status;
      title.textContent = event.title;
      body.textContent = new Date(event.receivedAt).toLocaleTimeString() + " - " + event.body;
      element.append(title, body);
      feedNode.prepend(element);

      while (feedNode.children.length > 12) {
        feedNode.removeChild(feedNode.lastElementChild);
      }
    }

    function notify(event) {
      if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
      }

      new Notification(event.title, {
        body: event.body,
        tag: event.alertname + "-" + event.status,
        renotify: true,
      });
    }

    allowButton.addEventListener("click", async () => {
      if (!("Notification" in window)) {
        return;
      }

      const permission = await Notification.requestPermission();
      notificationPermission();

      if (permission === "granted") {
        setStatus("Notifications enabled. Waiting for the service to do something regrettable.");
      }
    });

    fetch("/alerts/history")
      .then((response) => response.json())
      .then((events) => events.forEach(renderEvent))
      .catch(() => {});

    const events = new EventSource("/alerts/events");
    events.onopen = () => {
      setStatus("Connected. Waiting for Alertmanager.");
      notificationPermission();
    };
    events.onerror = () => {
      setStatus("Reconnecting to alert stream...");
    };
    events.onmessage = (message) => {
      const event = JSON.parse(message.data);
      if (event.status === "firing" && event.alertname !== "SLODojoComplete") {
        firingAlerts.add(event.alertname);
      } else if (event.status === "resolved") {
        firingAlerts.delete(event.alertname);
      }

      renderEvent(event);
      notify(event);
      document.title = firingAlerts.size > 0 ? "PAGE - SLO Dojo" : "SLO Dojo On-Call";
    };

    checkGrafanaReady();
    notificationPermission();
  </script>
</body>
</html>`);
}

function alertHistory(request, response) {
    response.status(200).json(history);
}

function alertEvents(request, response) {
    response.writeHead(200, {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
    });
    response.write("\n");

    clients.add(response);

    request.on("close", () => {
        clients.delete(response);
    });
}

function summarize(alert) {
    const alertname = alert.labels.alertname || "SLODojoAlert";
    const summary = alert.annotations.summary || alertname;
    const feedback = alert.annotations.feedback || `${alertname} resolved`;
    const status = alert.status || "firing";
    const titlePrefix = status === "resolved" ? "Resolved" : "Page";

    return {
        alertname,
        body: status === "resolved" ? feedback : summary,
        id: `${alert.fingerprint || alertname}-${status}-${Date.now()}`,
        receivedAt: new Date().toISOString(),
        status,
        title: `${titlePrefix}: ${alertname}`,
    };
}

function broadcast(event) {
    history.push(event);

    if (history.length > maxHistory) {
        history.shift();
    }

    const payload = `data: ${JSON.stringify(event)}\n\n`;

    for (const client of clients) {
        client.write(payload);
    }
}

function alertmanagerWebhook(request, response) {
    const alerts = Array.isArray(request.body.alerts) ? request.body.alerts : [];

    for (const alert of alerts) {
        broadcast(summarize(alert));
    }

    response.status(202).json({ received: alerts.length });
}

async function grafanaHealth(request, response) {
    const hostGrafanaUrl = new URL(request.protocol + "://" + request.get("host"));
    hostGrafanaUrl.port = "4000";
    hostGrafanaUrl.pathname = "/api/health";
    hostGrafanaUrl.search = "";
    hostGrafanaUrl.hash = "";

    const healthUrls = [
        process.env.GRAFANA_HEALTH_URL || defaultGrafanaHealthUrl,
        hostGrafanaUrl.toString(),
    ];

    for (const healthUrl of new Set(healthUrls)) {
        try {
            const grafanaResponse = await fetch(healthUrl, {
                signal: AbortSignal.timeout(1000),
            });

            if (!grafanaResponse.ok) {
                continue;
            }

            const body = await grafanaResponse.json();

            if (body.database === "ok") {
                return response.status(200).json({ ready: true });
            }
        } catch (error) {
        }
    }

    return response.status(503).json({ ready: false });
}

module.exports = {
    alertEvents,
    alertHistory,
    alertPage,
    alertmanagerWebhook,
    grafanaHealth,
};
