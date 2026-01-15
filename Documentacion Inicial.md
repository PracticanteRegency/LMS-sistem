# Docker

Estructura de las carpetas

```docker
project-root/
│
├── backend/
│   ├── Dockerfile
│   ├── .env
│   ├── requirements.txt
│   ├── manage.py
│   └── app/
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│
├── nginx/
│   ├── nginx.dev.con
│   └── nginx.prod.conf
│
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── .env

```

Esto es opcional para hacer la prueba de crear contenedor por contenedor

[Docker compose 1 por 1](Docker%20compose%201%20por%201%202e1172a405c88081908fd2e3d9ba67e2.md)

## Demostración docker compose completo

Base de datos (por si no se tiene una)

```docker
version: "3.9"

services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
      MYSQL_DATABASE: formularios
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3307:3306"
    networks:
      - shared_net

volumes:
  mysql_data:

networks:
  shared_net:
    external: true
```

Todo completo (dev)

```docker
version: "3.9"

services:
  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    env_file:
      - .env
    ports:
      - "8000:8000"
    depends_on:
      - redis

  frontend:
    image: node:20-alpine
    working_dir: /app
    command: npm run dev -- --host
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - backend
      - frontend

volumes:
  redis_data:

```

Todo completo (prod)

```docker
version: "3.9"

services:
  backend:
    build: ./backenddocker compose -f docker-compose.dev.yml up --build
    command: gunicorn app.wsgi:application --bind 0.0.0.0:8000
    env_file:
      - .env
    depends_on:
      - redis
    expose:
      - "8000"

  frontend:
    build: ./frontend
    expose:
      - "80"

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - backend
      - frontend

volumes:
  redis_data:
```

Crear red compartida para contenedores (si se desea tener la base de datos en un contenedor.  Esto implica que todos los contenedores en dev y prod tengan una propiedad network con el nombre de la red)

```docker
docker network create shared_net
```

Levantar contenedor y construir imagen

(Opcional la flag -f que es para indicar el nombre del archivo compose, la flag -d es para levantar en segundo plano los contenedores, la flag -p es para vincular los contenedores en un proyecto)

```docker
docker compose -f docker-compose.dev.yml -p infra up --build

docker compose -f docker-compose.prod.yml -p infra-lms up --build -d

# Contenedor en especifico
docker compose -f docker-compose.prod.yml -p infra-lms up --build -d backend
```

Bajar contenedores y eliminarlos

```docker
docker compose -f docker-compose.dev.yml -p infra down

# Contenedor en especifico
docker compose -f docker-compose.dev.yml -p infra down backend
```

Reconstruir imagen y levantar nuevamente contenedor si hay cambios (solo prod)

```docker
docker compose -f docker-compose.prod.yml -p infra-lms build

docker compose -f docker-compose.prod.yml -p infra-lms up -d
```

Comandos completos y sugerencias

[🐳 Chuleta de comandos Docker Compose (DEV / PROD)](%F0%9F%90%B3%20Chuleta%20de%20comandos%20Docker%20Compose%20(DEV%20PROD)%202e2172a405c880c480c9c8155a7b5405.md)