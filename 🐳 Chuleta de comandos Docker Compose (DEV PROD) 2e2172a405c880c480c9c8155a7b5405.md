# 🐳 Chuleta de comandos Docker Compose (DEV / PROD)

# Este archivo resume **los comandos esenciales** para trabajar con tu stack:

- Django (backend)
- React + Vite (frontend)
- Nginx
- Redis
- Red Docker externa (`shared_net`)

Úsalo como referencia rápida en tu día a día.

---

## 🚀 Levantar contenedores (DESARROLLO)

### Levantar todo en primer plano

```bash
docker compose -f docker-compose.dev.yml up

```

### Levantar todo en segundo plano

```bash
docker compose -f docker-compose.dev.yml up -d

```

### Levantar forzando rebuild de imágenes

```bash
docker compose -f docker-compose.dev.yml up --build

```

---

## 🛑 Detener contenedores

### Detener servicios (sin borrar contenedores)

```bash
docker compose -f docker-compose.dev.yml stop

```

### Detener y eliminar contenedores

```bash
docker compose -f docker-compose.dev.yml down

```

> ⚠️ Esto NO elimina volúmenes (datos de Redis, DB, etc. se conservan)
> 

---

## 🔁 Reiniciar servicios

### Reiniciar todos los servicios

```bash
docker compose -f docker-compose.dev.yml restart

```

### Reiniciar un servicio específico

```bash
docker compose -f docker-compose.dev.yml restart backend

```

---

## 🔧 Rebuild (cuando cambias Dockerfile o algo se rompe)

### Rebuild completo sin caché

```bash
docker compose -f docker-compose.dev.yml build --no-cache

```

### Rebuild de un solo servicio

```bash
docker compose -f docker-compose.dev.yml build backend

```

---

## 📦 Cuando cambian dependencias

### Backend (requirements.txt)

```bash
docker compose -f docker-compose.dev.yml build backend
docker compose -f docker-compose.dev.yml up

```

### Frontend (package.json)

```bash
docker compose -f docker-compose.dev.yml down
rm -rf frontend/node_modules frontend/package-lock.json
docker compose -f docker-compose.dev.yml up --build

```

---

## 🧪 Ver logs (debug rápido)

### Todos los servicios

```bash
docker compose -f docker-compose.dev.yml logs -f

```

### Servicio específico

```bash
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f nginx
docker compose -f docker-compose.dev.yml logs -f redis

```

---

## 🔍 Entrar a contenedores (debug manual)

### Backend (Django)

```bash
docker exec -it backend bash

```

### Frontend (Vite)

```bash
docker exec -it frontend sh

```

### Redis

```bash
docker exec -it redis sh

```

---

## 🌐 Redes Docker (red externa)

### Listar redes

```bash
docker network ls

```

### Inspeccionar la red compartida

```bash
docker network inspect shared_net

```

---

## 🧠 Diagnóstico rápido de DNS (MUY ÚTIL)

```bash
docker exec -it backend ping redis
docker exec -it backend ping mysql
docker exec -it frontend ping nginx
docker exec -it nginx ping backend

```

✔️ Si responde → red correcta

❌ Si falla → problema de red o servicio fuera de `shared_net`

---

## 🧹 Limpieza (cuando Docker se pone raro)

### Eliminar contenedores detenidos

```bash
docker container prune

```

### Eliminar imágenes sin usar

```bash
docker image prune

```

### ⚠️ Limpieza TOTAL (usar con cuidado)

```bash
docker system prune -a

```

---

## 🚀 Producción

### Build + levantar producción

```bash
docker compose -f docker-compose.prod.yml up -d --build

```

### Logs de producción

```bash
docker compose -f docker-compose.prod.yml logs -f

```

---

## 🧠 Reglas mentales finales

- ❌ No usar `localhost` entre contenedores
- ✅ Usar nombres de servicio (`backend`, `redis`, `nginx`)
- ✅ Servicios que se comuniquen → misma red Docker
- ❌ Vite en producción
- ✅ Nginx en producción
- ❌ Compartir `node_modules`
- ✅ Volúmenes para datos persistentes

---

📌 **Tip final**: Si algo falla, revisa en este orden:

1. Logs
2. Red (`ping` entre contenedores)
3. `docker-compose.yml`
4. Variables de entorno

Este archivo es tu **chuleta oficial del proyecto** 🚀