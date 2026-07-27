# Despliegue local con Kubernetes

Los manifiestos crean recursos idempotentes en el namespace `nexo-park`.
PostgreSQL y RabbitMQ usan PVC, por lo que `kubectl apply` no borra datos.

## Requisitos

- Docker, `kubectl` y Minikube.
- `.env`, `.secrets/jwt-private.pem` y `.secrets/jwt-public.pem`.

## Desde WSL Ubuntu

```bash
cd /mnt/c/Users/mesia/Desktop/Universidad/Distribuidas/2P
minikube start --driver=docker
minikube addons enable ingress
kubectl get nodes
bash scripts/k8s-build.sh
bash scripts/k8s-validate.sh
bash scripts/k8s-deploy.sh
```

Cuando el contexto es `minikube`, el script de build conecta Docker al daemon
interno de Minikube y construye las imágenes directamente allí.

En otra terminal deja activo el túnel de Minikube:

```bash
minikube tunnel
```

Luego agrega el dominio al archivo `hosts`:

```text
127.0.0.1 nexo.local
```

Con todos los pods listos y el tunel activo, carga datos funcionales de
demostracion sin borrar los usuarios existentes:

```bash
bash scripts/seed-demo.sh
```

La carga crea clientes, un recaudador, zonas, espacios, vehiculos,
asignaciones y tickets con distintos estados. Si ya existen tickets demo,
el script termina sin duplicarlos.

Consulta el estado con:

```bash
bash scripts/k8s-status.sh
kubectl logs -n nexo-park deployment/usuarios
kubectl describe pod -n nexo-park <pod>
```

Repite la validación local sin desplegar con:

```bash
bash scripts/k8s-validate.sh
```

No elimines el namespace ni los PVC si deseas conservar los datos.

## Reinicio de datos local

Si PostgreSQL o RabbitMQ quedan dañados durante pruebas locales, elimina solo
los recursos de desarrollo de esta aplicación y vuelve a desplegar:

```bash
bash scripts/k8s-reset-dev.sh --yes
bash scripts/k8s-deploy.sh
```

Este comando borra el namespace `nexo-park`, incluidos sus PVC y todos sus
datos de desarrollo. No afecta otros namespaces ni proyectos.
