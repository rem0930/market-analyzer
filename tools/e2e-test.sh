#!/bin/bash
# E2E API test for trade-area endpoints
set -e

# 1. Login and get token
LOGIN_RESP=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"Password123"}')
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.accessToken')

# 2. Get CSRF token from any GET response's Set-Cookie header
CSRF_RESP=$(curl -si http://localhost:8080/health)
CSRF_TOKEN=$(echo "$CSRF_RESP" | grep -i 'set-cookie' | grep 'csrf-token' | sed 's/.*csrf-token=//; s/;.*//')

# If no CSRF token from health, generate one via the middleware
if [ -z "$CSRF_TOKEN" ]; then
  echo "No CSRF token from health, trying trade-areas GET..."
  CSRF_RESP=$(curl -si http://localhost:8080/trade-areas -H "Authorization: Bearer $TOKEN")
  CSRF_TOKEN=$(echo "$CSRF_RESP" | grep -i 'set-cookie' | grep 'csrf-token' | sed 's/.*csrf-token=//; s/;.*//')
fi

echo "CSRF Token: ${CSRF_TOKEN:0:20}..."
echo ""

# Helper function for mutating requests
post_json() {
  curl -s -X "$1" "$2" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -b "csrf-token=$CSRF_TOKEN" \
    -d "$3"
}

get_json() {
  curl -s "$1" -H "Authorization: Bearer $TOKEN"
}

echo "=== 1. POST /trade-areas (Create Shibuya) ==="
RESP1=$(post_json POST http://localhost:8080/trade-areas '{"name":"Shibuya Station","longitude":139.7016,"latitude":35.6580,"radiusKm":3}')
echo "$RESP1" | jq .
ID1=$(echo "$RESP1" | jq -r .id)

echo ""
echo "=== 2. POST /trade-areas (Create Tokyo Tower) ==="
RESP2=$(post_json POST http://localhost:8080/trade-areas '{"name":"Tokyo Tower","longitude":139.7454,"latitude":35.6586,"radiusKm":1.5}')
echo "$RESP2" | jq .
ID2=$(echo "$RESP2" | jq -r .id)

echo ""
echo "=== 3. GET /trade-areas (List - should be 2) ==="
get_json http://localhost:8080/trade-areas | jq .

echo ""
echo "=== 4. GET /trade-areas/{id} (Get Shibuya) ==="
get_json "http://localhost:8080/trade-areas/$ID1" | jq .

echo ""
echo "=== 5. PATCH /trade-areas/{id} (Update name + radius) ==="
RESP5=$(post_json PATCH "http://localhost:8080/trade-areas/$ID1" '{"name":"Shibuya Updated","radiusKm":5}')
echo "$RESP5" | jq .

echo ""
echo "=== 6. GET /trade-areas/{id}/demographics ==="
get_json "http://localhost:8080/trade-areas/$ID1/demographics" | jq .

echo ""
echo "=== 7. Demographics determinism test (same result) ==="
D1=$(get_json "http://localhost:8080/trade-areas/$ID1/demographics" | jq .population)
D2=$(get_json "http://localhost:8080/trade-areas/$ID1/demographics" | jq .population)
if [ "$D1" = "$D2" ]; then
  echo "PASS: Deterministic ($D1 == $D2)"
else
  echo "FAIL: Not deterministic ($D1 != $D2)"
fi

echo ""
echo "=== 8. DELETE /trade-areas/{id} ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "http://localhost:8080/trade-areas/$ID2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf-token=$CSRF_TOKEN")
echo "HTTP $HTTP_CODE"

echo ""
echo "=== 9. GET /trade-areas (After delete) ==="
TOTAL=$(get_json http://localhost:8080/trade-areas | jq .total)
echo "Total: $TOTAL (expected: 1)"

echo ""
echo "=== 10. Validation error (empty name) ==="
post_json POST http://localhost:8080/trade-areas '{"name":"","longitude":139,"latitude":35,"radiusKm":3}' | jq .code

echo ""
echo "=== 11. Auth required (no token) ==="
curl -s http://localhost:8080/trade-areas | jq .code

echo ""
echo "=== ALL TESTS DONE ==="
