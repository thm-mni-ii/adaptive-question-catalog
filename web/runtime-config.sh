#!/bin/sh
set -eu
# Restrict values before interpolating them into JavaScript.
printf '%s' "$FBS_HOST_ORIGIN" | grep -Eq '^https?://[a-zA-Z0-9.:-]+$' || exit 1
printf '%s' "$FBS_PROVIDER_ID" | grep -Eq '^[a-zA-Z0-9_-]+$' || exit 1
printf 'window.AQC_CONFIG = { fbsOrigin: "%s", providerId: "%s" };
' "$FBS_HOST_ORIGIN" "$FBS_PROVIDER_ID" > /usr/share/nginx/html/config.js
