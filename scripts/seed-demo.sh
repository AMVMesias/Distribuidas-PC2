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

if [[ "${1:-}" == "--reset" ]]; then
  echo "Eliminando únicamente los volúmenes del monorepo..."
  docker compose down -v
  docker compose up --build -d
else
  docker compose up -d
fi

echo "Esperando a que usuarios, zonas y vehículos estén disponibles..."
for attempt in $(seq 1 90); do
  if docker compose exec -T usuarios wget -qO- http://localhost:8080/actuator/health >/dev/null 2>&1 \
    && docker compose exec -T usuarios wget -qO- http://zonas:8080/actuator/health >/dev/null 2>&1 \
    && docker compose exec -T usuarios wget -qO- http://vehiculos:3000/health >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" == "90" ]]; then
    echo "Los servicios no estuvieron listos a tiempo." >&2
    docker compose ps
    exit 1
  fi
  sleep 2
done

post_json() {
  local url="$1"
  local body="$2"
  local token="${3:-}"
  local args=(docker compose exec -T usuarios wget -qO- --header "Content-Type: application/json")
  if [[ -n "$token" ]]; then
    args+=(--header "Authorization: Bearer $token")
  fi
  "${args[@]}" --post-data "$body" "$url"
}

json_value() {
  local key="$1"
  python3 -c "import json,sys; print(json.load(sys.stdin)['$key'])"
}

admin_body="$(ADMIN_USERNAME="$ADMIN_USERNAME" ADMIN_PASSWORD="$ADMIN_PASSWORD" python3 - <<'PY'
import json, os
print(json.dumps({"username": os.environ["ADMIN_USERNAME"], "password": os.environ["ADMIN_PASSWORD"]}))
PY
)"
admin_response="$(post_json http://localhost:8080/api/v1/auth/login "$admin_body")"
admin_token="$(printf '%s' "$admin_response" | json_value accessToken)"

zone_names=(Norte Sur Centro Visitantes Docentes Estudiantes Administrativa Deportiva Auditorio Laboratorios)
zone_types=(REGULAR REGULAR PREFERENCIAL EXTERNA VIP REGULAR INTERNA EXTERNA PREFERENCIAL INTERNA)

echo "Creando 10 zonas y 150 espacios..."
for zone_index in "${!zone_names[@]}"; do
  zone_number=$((zone_index + 1))
  zone_body="$(printf '{"nombre":"Zona %s","descripcion":"Área demostrativa %02d para pruebas de integración","tipo":"%s","capacidad":300}' \
    "${zone_names[$zone_index]}" "$zone_number" "${zone_types[$zone_index]}")"
  zone_response="$(post_json http://zonas:8080/api/v1/zonas "$zone_body" "$admin_token")"
  zone_id="$(printf '%s' "$zone_response" | json_value id)"

  for space_number in $(seq 1 15); do
    case $((space_number % 3)) in
      0) space_type=BUS; space_capacity=3 ;;
      1) space_type=AUTO; space_capacity=1 ;;
      2) space_type=MOTO; space_capacity=1 ;;
    esac
    code="Z$(printf '%02d' "$zone_number")-E$(printf '%03d' "$space_number")"
    space_body="$(printf '{"codigo":"%s","idZona":"%s","descripcion":"Espacio demo %02d de Zona %s","tipo":"%s","capacidad":%d,"estado":"DISPONIBLE"}' \
      "$code" "$zone_id" "$space_number" "${zone_names[$zone_index]}" "$space_type" "$space_capacity")"
    post_json http://zonas:8080/api/v1/espacios "$space_body" "$admin_token" >/dev/null
  done
done

first_names=(Ana Bruno Carla Diego Elena Felipe Gabriela Hugo Irene Javier Karen Luis Monica Nicolas Olivia Pablo Raquel Sergio Tatiana Ulises Valeria Walter Ximena Yago Zoe Mateo Sofia Daniel Camila Andres)
last_names=(Alvarez Benitez Cardenas Delgado Espinoza Flores Guerrero Herrera Ibarra Jimenez Lara Mendoza Navarro Ortiz Paredes Quintero Rojas Salazar Torres Urbina Vega Zambrano Acosta Bustamante Cruz Davila Escobar Fuentes Gavilanes Hidalgo)
brands=(Toyota Chevrolet Kia Hyundai Nissan Mazda Renault Ford Honda Volkswagen)
colors=(Rojo Azul Blanco Negro Gris Verde Plata Amarillo Cafe Violeta)

echo "Creando 30 usuarios y 90 vehículos..."
for user_index in "${!first_names[@]}"; do
  user_number=$((user_index + 1))
  dni="179$(printf '%07d' "$user_number")"
  email="demo$(printf '%02d' "$user_number")@gateway.local"
  phone="099$(printf '%07d' "$user_number")"
  register_body="$(printf '{"persona":{"dni":"%s","firstName":"%s","middleName":"Demo","lastName":"%s","email":"%s","phone":"%s","address":"Campus universitario, bloque %02d","nationality":"Ecuatoriana"},"password":"Demo12345!"}' \
    "$dni" "${first_names[$user_index]}" "${last_names[$user_index]}" "$email" "$phone" "$user_number")"
  register_response="$(post_json http://localhost:8080/api/v1/auth/register "$register_body")"
  user_token="$(printf '%s' "$register_response" | json_value accessToken)"

  for vehicle_number in 1 2 3; do
    serial=$((user_index * 3 + vehicle_number))
    prefix="$(printf '%03d' "$serial" | tr '0-9' 'A-J')"
    plate="${prefix}-$(printf '%04d' "$serial")"
    brand="${brands[$((serial % ${#brands[@]}))]}"
    color="${colors[$((serial % ${#colors[@]}))]}"
    year=$((2015 + serial % 11))
    case "$vehicle_number" in
      1)
        vehicle_body="$(printf '{"tipo":"auto","datos":{"placa":"%s","marca":"%s","modelo":"Sedan %d","color":"%s","anio":%d,"clasificacion":"Gasolina","numeroPuertas":4,"capacidadMaletero":480}}' "$plate" "$brand" "$serial" "$color" "$year")"
        ;;
      2)
        vehicle_body="$(printf '{"tipo":"motocicleta","datos":{"placa":"%s","marca":"%s","modelo":"Moto %d","color":"%s","anio":%d,"clasificacion":"Gasolina","tipoMoto":"Scooter"}}' "$plate" "$brand" "$serial" "$color" "$year")"
        ;;
      3)
        vehicle_body="$(printf '{"tipo":"camioneta","datos":{"placa":"%s","marca":"%s","modelo":"Pickup %d","color":"%s","anio":%d,"clasificacion":"Hibrido","capacidadCarga":1200,"traccion":"4x4"}}' "$plate" "$brand" "$serial" "$color" "$year")"
        ;;
    esac
    post_json http://vehiculos:3000/api/v1/vehiculos "$vehicle_body" "$user_token" >/dev/null
  done
done

echo
echo "Datos demo creados:"
echo "  usuarios: 30 USER + 1 ADMIN"
echo "  zonas: 10"
echo "  espacios: 150"
echo "  vehículos: 90"
echo "Contraseña de usuarios demo: Demo12345!"

