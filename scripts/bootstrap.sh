#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
[ -f "$ROOT/.env" ] || cp "$ROOT/.env.example" "$ROOT/.env"
mkdir -p "$ROOT/.secrets"

PRIVATE="$ROOT/.secrets/jwt-private.pem"
PUBLIC="$ROOT/.secrets/jwt-public.pem"
if [ ! -f "$PRIVATE" ] || [ ! -f "$PUBLIC" ]; then
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$PRIVATE"
  openssl rsa -pubout -in "$PRIVATE" -out "$PUBLIC"
  chmod 600 "$PRIVATE"
fi

JWT_ISSUER=$(grep '^JWT_ISSUER=' "$ROOT/.env" | cut -d= -f2-)
CORS_ORIGINS=$(grep '^CORS_ORIGINS=' "$ROOT/.env" | cut -d= -f2-)
CORS_JSON='['
OLD_IFS=$IFS; IFS=','
for origin in $CORS_ORIGINS; do
  [ "$CORS_JSON" = '[' ] || CORS_JSON="$CORS_JSON,"
  CORS_JSON="$CORS_JSON\"$origin\""
done
IFS=$OLD_IFS
CORS_JSON="$CORS_JSON]"

TMP="$ROOT/infrastructure/kong/kong.yml.tmp"
sed "s|__JWT_ISSUER__|$JWT_ISSUER|g; s|__CORS_ORIGINS__|$CORS_JSON|g" \
  "$ROOT/infrastructure/kong/kong.yml.template" |
awk -v pubfile="$PUBLIC" '
  /__JWT_PUBLIC_KEY__/ {
    while ((getline line < pubfile) > 0) {
      sub(/\r$/, "", line)
      print "          " line
    }
    close(pubfile)
    next
  }
  { print }
' > "$TMP"
mv "$TMP" "$ROOT/infrastructure/kong/kong.yml"
printf '%s\n' 'Configuración local generada. Ejecuta: docker compose up --build'
