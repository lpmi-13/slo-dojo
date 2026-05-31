#!/bin/bash
set -euo pipefail

docker compose up -d --build app

echo "App redeployed from the current local source tree."
echo "Wait about a minute for Prometheus and Alertmanager to reflect the new SLO state."
