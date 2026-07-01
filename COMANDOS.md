# Comandos esenciales

Proyecto en WSL:

```bash
/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P
```

---

## 1. Crear / iniciar por primera vez

Ejecuta esto una sola vez para preparar `.env`, claves JWT y configuracion de Kong:

```bash
wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P' && bash scripts/bootstrap.sh"
```

Luego levanta todo:

```bash
wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P' && docker compose up -d --build"
```

Verificar que este corriendo:

```bash
wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P' && docker compose ps"
```

---

## 2. Compilar despues de cambios

Si cambiaste codigo, usa `--build`.

Compilar y levantar todo:

```bash
wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P' && docker compose up -d --build"
```

Compilar solo un servicio:

```bash
wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P' && docker compose up -d --build usuarios"
```

Puedes cambiar `usuarios` por:

```bash
zonas
vehiculos
asignaciones
tickets
web
kong
```

---

## 3. Apagar / eliminar

Apagar todo sin borrar bases de datos:

```bash
wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P' && docker compose down"
```

Apagar y borrar bases de datos:

```bash
wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P' && docker compose down -v"
```

Limpieza total, incluyendo imagenes locales:

```bash
wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P' && docker compose down -v --rmi local"
```

Usa `down -v` solo cuando quieras empezar desde cero, porque borra los datos de las bases de datos.
