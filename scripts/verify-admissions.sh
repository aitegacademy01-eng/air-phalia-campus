#!/usr/bin/env bash
# Production admissions check. Prints only status codes and the test enquiry's own fields.
# Never prints ADMIN_TOKEN or any other enquiry.
set -uo pipefail
BASE="${BASE_URL:-https://air-phalia-campus.vercel.app}"
pass=0; fail=0
ok(){ echo "PASS  $*"; pass=$((pass+1)); }
bad(){ echo "FAIL  $*"; fail=$((fail+1)); }
code(){ curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$@"; }

[ "$(code "$BASE/")" = 200 ] && ok "homepage 200" || bad "homepage not 200"
[ "$(code "$BASE/privacy")" = 200 ] && ok "privacy page 200" || bad "privacy page not 200"
curl -sI --max-time 30 "$BASE/admin" | grep -qi '^x-robots-tag: noindex' && ok "/admin is noindex" || bad "/admin missing noindex header"

# 1+2. Submit a clearly labelled test enquiry
label="TEST ENQUIRY - automated check - please ignore (run ${GITHUB_RUN_ID:-local})"
body=$(jq -nc --arg n "TEST ENQUIRY - automated check" --arg m "$label" '{name:$n,phone:"03000000000",level:"High School",message:$m,website:"",consent:true}')
resp=$(curl -s --max-time 30 -w '\n%{http_code}' -H "Origin: $BASE" -H 'Content-Type: application/json' -d "$body" "$BASE/api/enquiries")
status=$(tail -n1 <<<"$resp"); json=$(sed '$d' <<<"$resp")
id=$(jq -r '.id // empty' <<<"$json" 2>/dev/null)
if [ "$status" = 200 ] && [ -n "$id" ]; then ok "test enquiry accepted and saved (id $id)"; else bad "test enquiry not saved (HTTP $status: $(jq -r '.error // "no message"' <<<"$json" 2>/dev/null))"; fi

# 4. Staff access protection
[ "$(code "$BASE/api/admin/enquiries")" = 401 ] && ok "admin API rejects missing token" || bad "admin API did not reject missing token"
[ "$(code -H 'Authorization: Bearer wrong-token-check' "$BASE/api/admin/enquiries")" = 401 ] && ok "admin API rejects wrong token" || bad "admin API did not reject wrong token"

# 3. Retrieve and update via the protected admin API (needs repo secret ADMIN_TOKEN)
if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "SKIP  admin retrieval/update: GitHub secret ADMIN_TOKEN not set"
elif [ -z "$id" ]; then
  echo "SKIP  admin retrieval/update: no test enquiry id"
else
  [ ${#ADMIN_TOKEN} -ge 24 ] && ok "ADMIN_TOKEN length is 24+ characters" || bad "ADMIN_TOKEN is shorter than 24 characters (use a longer random value)"
  auth="Authorization: Bearer $ADMIN_TOKEN"
  list=$(curl -s --max-time 30 -H "$auth" "$BASE/api/admin/enquiries")
  row=$(jq -c --arg id "$id" '[.[]? | select(.id==$id)][0] // empty | {name,level,status}' <<<"$list" 2>/dev/null)
  [ -n "$row" ] && ok "test enquiry retrieved from admin API: $row" || bad "test enquiry not found via admin API (token mismatch or not stored)"
  pc=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X PATCH -H "$auth" -H 'Content-Type: application/json' -d "{\"id\":\"$id\",\"status\":\"closed\"}" "$BASE/api/admin/enquiries")
  after=$(curl -s --max-time 30 -H "$auth" "$BASE/api/admin/enquiries" | jq -r --arg id "$id" '[.[]? | select(.id==$id)][0].status // empty' 2>/dev/null)
  [ "$pc" = 200 ] && [ "$after" = closed ] && ok "status update persisted (test enquiry now 'closed')" || bad "status update failed (HTTP $pc, status now '${after:-unknown}')"
fi
echo "SUMMARY pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
