#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env || ! -f infrastructure/kong/kong.yml ]]; then
  echo "Falta ejecutar scripts/bootstrap.sh antes de cargar datos." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

BASE_URL="${BASE_URL:-http://localhost:8000}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo12345!}"
RECAUDADOR_PASSWORD="${RECAUDADOR_PASSWORD:-Recaudador12345!}"
RESET=false

if [[ "${1:-}" == "--reset" ]]; then
  RESET=true
  echo "Eliminando unicamente los volumenes del monorepo..."
  docker compose down -v
  docker compose up --build -d
else
  docker compose up -d
fi

echo "Esperando a que el gateway y los servicios esten disponibles..."
for attempt in $(seq 1 120); do
  if curl -fsS "$BASE_URL/usuarios/v3/api-docs" >/dev/null 2>&1 \
    && curl -fsS "$BASE_URL/zonas/v3/api-docs" >/dev/null 2>&1 \
    && curl -fsS "$BASE_URL/vehiculos/v3/api-docs" >/dev/null 2>&1 \
    && curl -fsS "$BASE_URL/asignaciones/v3/api-docs" >/dev/null 2>&1 \
    && curl -fsS "$BASE_URL/tickets/v3/api-docs" >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" == "120" ]]; then
    echo "Los servicios no estuvieron listos a tiempo." >&2
    docker compose ps
    exit 1
  fi
  sleep 2
done

request_json() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local token="${4:-}"
  local tmp_body tmp_status
  tmp_body="$(mktemp)"
  tmp_status="$(mktemp)"

  local args=(-sS -X "$method" "$BASE_URL$path" -H "Accept: application/json")
  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" --data "$body")
  fi
  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer $token")
  fi

  if ! curl "${args[@]}" -o "$tmp_body" -w "%{http_code}" > "$tmp_status"; then
    echo "No se pudo contactar $method $path" >&2
    cat "$tmp_body" >&2 || true
    rm -f "$tmp_body" "$tmp_status"
    exit 1
  fi

  local status
  status="$(cat "$tmp_status")"
  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    echo "Error cargando datos demo en $method $path (HTTP $status)" >&2
    cat "$tmp_body" >&2
    echo >&2
    rm -f "$tmp_body" "$tmp_status"
    exit 1
  fi

  cat "$tmp_body"
  rm -f "$tmp_body" "$tmp_status"
}

json_get() {
  local expression="$1"
  python3 -c "import json,sys; data=json.load(sys.stdin); print($expression)"
}

json_body() {
  python3 - "$@" <<'PY'
import json
import sys

pairs = dict(arg.split("=", 1) for arg in sys.argv[1:])
print(json.dumps(pairs, ensure_ascii=False))
PY
}

login() {
  local username="$1"
  local password="$2"
  local body
  body="$(python3 - "$username" "$password" <<'PY'
import json
import sys
print(json.dumps({"username": sys.argv[1], "password": sys.argv[2]}))
PY
)"
  request_json POST /api/v1/auth/login "$body" | json_get "data['accessToken']"
}

admin_token="$(login "$ADMIN_USERNAME" "$ADMIN_PASSWORD")"

if [[ "$RESET" == "false" ]]; then
  existing_tickets_count="$(request_json GET /api/v1/tickets "" "$admin_token" | json_get "len(data)")"
  if [[ "$existing_tickets_count" -gt 0 ]]; then
    echo "Ya existen tickets en la base demo ($existing_tickets_count). No se duplicaron datos."
    echo "Si quieres recargar todo desde cero, ejecuta: bash scripts/seed-demo.sh --reset"
    exit 0
  fi
fi

roles_response="$(request_json GET /api/v1/roles "" "$admin_token")"
cliente_role_id="$(printf '%s' "$roles_response" | json_get "next(role['id'] for role in data if role['name'] == 'CLIENTE')")"
recaudador_role_id="$(printf '%s' "$roles_response" | json_get "next(role['id'] for role in data if role['name'] == 'RECAUDADOR')")"

create_user() {
  local dni="$1"
  local first="$2"
  local last="$3"
  local email="$4"
  local password="$5"
  local body
  body="$(python3 - "$dni" "$first" "$last" "$email" "$password" <<'PY'
import json
import sys
dni, first, last, email, password = sys.argv[1:]
print(json.dumps({
  "persona": {
    "dni": dni,
    "firstName": first,
    "middleName": "Demo",
    "lastName": last,
    "email": email,
    "phone": "0999999999",
    "address": "Campus universitario",
    "nationality": "Ecuatoriana"
  },
  "password": password
}))
PY
)"
  local existing
  existing="$(request_json GET /api/v1/usuarios "" "$admin_token" | python3 -c 'import json,sys; email=sys.argv[1]; users=json.load(sys.stdin); match=next((user for user in users if user.get("persona", {}).get("email") == email), None); print(json.dumps(match) if match else "")' "$email")"
  if [[ -n "$existing" ]]; then
    local user_id
    user_id="$(printf '%s' "$existing" | json_get "data['idPerson']")"
    request_json PUT "/api/v1/usuarios/$user_id" "$body" "$admin_token"
  else
    request_json POST /api/v1/usuarios "$body" "$admin_token"
  fi
}

assign_role() {
  local user_id="$1"
  local role_id="$2"
  local tmp_body tmp_status status
  tmp_body="$(mktemp)"
  tmp_status="$(mktemp)"
  curl -sS -X POST "$BASE_URL/api/v1/usuarios/$user_id/roles/$role_id" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $admin_token" \
    --data "{}" \
    -o "$tmp_body" \
    -w "%{http_code}" > "$tmp_status"
  status="$(cat "$tmp_status")"
  if [[ "$status" -eq 409 ]]; then
    rm -f "$tmp_body" "$tmp_status"
    return 0
  fi
  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    echo "Error asignando rol $role_id al usuario $user_id (HTTP $status)" >&2
    cat "$tmp_body" >&2
    echo >&2
    rm -f "$tmp_body" "$tmp_status"
    exit 1
  fi
  rm -f "$tmp_body" "$tmp_status"
}

echo "Creando usuario RECAUDADOR demo..."
recaudador_response="$(create_user "1799000001" "Rene" "Recaudador" "recaudador.demo@gateway.local" "$RECAUDADOR_PASSWORD")"
recaudador_id="$(printf '%s' "$recaudador_response" | json_get "data['idPerson']")"
recaudador_username="$(printf '%s' "$recaudador_response" | json_get "data['username']")"
assign_role "$recaudador_id" "$recaudador_role_id"
recaudador_token="$(login "$recaudador_username" "$RECAUDADOR_PASSWORD")"

zone_specs=(
  "Norte REGULAR"
  "Centro PREFERENCIAL"
  "Sur EXTERNA"
)

space_ids=()
space_codes=()

echo "Creando zonas y espacios demo..."
zone_index=0
for spec in "${zone_specs[@]}"; do
  zone_index=$((zone_index + 1))
  read -r zone_name zone_type <<<"$spec"
  zone_body="$(python3 - "$zone_name" "$zone_type" "$zone_index" <<'PY'
import json
import sys
name, zone_type, number = sys.argv[1:]
print(json.dumps({
  "nombre": f"Zona {name}",
  "descripcion": f"Zona demo {number} para pruebas funcionales",
  "tipo": zone_type,
  "capacidad": 12
}))
PY
)"
  zone_response="$(request_json POST /api/v1/zonas "$zone_body" "$admin_token")"
  zone_id="$(printf '%s' "$zone_response" | json_get "data['id']")"

  for space_number in 1 2 3 4; do
    case "$space_number" in
      1|2) space_type=AUTO ;;
      3) space_type=MOTO ;;
      *) space_type=BUS ;;
    esac
    code="D$(printf '%02d' "$zone_index")-E$(printf '%02d' "$space_number")"
    space_body="$(python3 - "$code" "$zone_id" "$space_type" "$zone_name" "$space_number" <<'PY'
import json
import sys
code, zone_id, space_type, zone_name, number = sys.argv[1:]
print(json.dumps({
  "codigo": code,
  "idZona": zone_id,
  "descripcion": f"Espacio demo {number} de Zona {zone_name}",
  "tipo": space_type,
  "capacidad": 3 if space_type == "BUS" else 1,
  "estado": "DISPONIBLE"
}))
PY
)"
    space_response="$(request_json POST /api/v1/espacios "$space_body" "$admin_token")"
    space_ids+=("$(printf '%s' "$space_response" | json_get "data['id']")")
    space_codes+=("$code")
  done
done

first_names=(Ana Bruno Carla Diego Elena Felipe Gabriela Hugo)
last_names=(Alvarez Benitez Cardenas Delgado Espinoza Flores Guerrero Herrera)
brands=(Toyota Chevrolet Kia Hyundai Nissan Mazda Renault Ford)
colors=(Rojo Azul Blanco Negro Gris Verde Plata Amarillo)

client_usernames=()
client_ids=()
vehicle_ids=()
vehicle_plates=()

echo "Creando clientes, vehiculos y asignaciones demo..."
for i in "${!first_names[@]}"; do
  n=$((i + 1))
  dni="1798$(printf '%06d' "$n")"
  email="cliente$(printf '%02d' "$n")@gateway.local"
  user_response="$(create_user "$dni" "${first_names[$i]}" "${last_names[$i]}" "$email" "$DEMO_PASSWORD")"
  user_id="$(printf '%s' "$user_response" | json_get "data['idPerson']")"
  username="$(printf '%s' "$user_response" | json_get "data['username']")"
  assign_role "$user_id" "$cliente_role_id"
  client_ids+=("$user_id")
  client_usernames+=("$username")

  user_token="$(login "$username" "$DEMO_PASSWORD")"
  for vehicle_number in 1 2; do
    serial=$((i * 2 + vehicle_number))
    plate="P$(printf '%02d' "$n" | tr '0-9' 'A-J')-$(printf '%04d' "$serial")"
    brand="${brands[$((serial % ${#brands[@]}))]}"
    color="${colors[$((serial % ${#colors[@]}))]}"
    year=$((2016 + serial % 9))
    if [[ "$vehicle_number" == "1" ]]; then
      vehicle_body="$(python3 - "$plate" "$brand" "$serial" "$color" "$year" <<'PY'
import json
import sys
plate, brand, serial, color, year = sys.argv[1:]
print(json.dumps({
  "tipo": "auto",
  "datos": {
    "placa": plate,
    "marca": brand,
    "modelo": f"Sedan {serial}",
    "color": color,
    "anio": int(year),
    "clasificacion": "Gasolina",
    "numeroPuertas": 4,
    "capacidadMaletero": 480
  }
}))
PY
)"
    else
      vehicle_body="$(python3 - "$plate" "$brand" "$serial" "$color" "$year" <<'PY'
import json
import sys
plate, brand, serial, color, year = sys.argv[1:]
print(json.dumps({
  "tipo": "motocicleta",
  "datos": {
    "placa": plate,
    "marca": brand,
    "modelo": f"Moto {serial}",
    "color": color,
    "anio": int(year),
    "clasificacion": "Gasolina",
    "tipoMoto": "Scooter"
  }
}))
PY
)"
    fi

    vehicle_response="$(request_json POST /api/v1/vehiculos "$vehicle_body" "$user_token")"
    vehicle_id="$(printf '%s' "$vehicle_response" | json_get "data['id']")"
    vehicle_ids+=("$vehicle_id")
    vehicle_plates+=("$plate")
    assignment_body="$(python3 - "$vehicle_id" <<'PY'
import json
import sys
print(json.dumps({"vehicleId": sys.argv[1]}))
PY
)"
    request_json POST /api/v1/asignaciones "$assignment_body" "$user_token" >/dev/null
  done
done

echo "Creando tickets demo: uno activo, uno pagado y uno cancelado..."
ticket_ids=()
for i in 0 1 2; do
  ticket_body="$(python3 - "${space_ids[$i]}" "${vehicle_ids[$i]}" <<'PY'
import json
import sys
print(json.dumps({"idEspacio": sys.argv[1], "idVehiculo": sys.argv[2]}))
PY
)"
  ticket_response="$(request_json POST /api/v1/tickets "$ticket_body" "$recaudador_token")"
  ticket_ids+=("$(printf '%s' "$ticket_response" | json_get "data['id']")")
done
request_json PATCH "/api/v1/tickets/${ticket_ids[1]}/pagar" "{}" "$recaudador_token" >/dev/null
request_json PATCH "/api/v1/tickets/${ticket_ids[2]}/cancelar" "{}" "$recaudador_token" >/dev/null

echo
echo "Datos demo creados:"
echo "  usuarios: 8 CLIENTE + 1 RECAUDADOR + 1 ADMIN"
echo "  zonas: 3"
echo "  espacios: 12"
echo "  vehiculos: 16"
echo "  asignaciones activas: 16"
echo "  tickets: 1 ACTIVO, 1 PAGADO, 1 CANCELADO"
echo
echo "Credenciales demo:"
echo "  ADMIN:       $ADMIN_USERNAME / $ADMIN_PASSWORD"
echo "  RECAUDADOR:  $recaudador_username / $RECAUDADOR_PASSWORD"
echo "  CLIENTE 1:   ${client_usernames[0]} / $DEMO_PASSWORD"
echo "  CLIENTE 2:   ${client_usernames[1]} / $DEMO_PASSWORD"
echo
echo "Datos utiles para probar:"
echo "  Placa con ticket ACTIVO:    ${vehicle_plates[0]}"
echo "  Espacio ocupado por ticket: ${space_codes[0]}"
echo "  Placa disponible:           ${vehicle_plates[3]}"
