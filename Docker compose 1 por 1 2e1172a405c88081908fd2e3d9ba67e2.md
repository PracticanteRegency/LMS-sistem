# Docker compose 1 por 1

## Demostración docker compose uno por uno

Crea contenedor con imagen de mysql (docker-compose.mysql.yml)

```docker
version: "3.9"

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-db
    environment:
      MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
      MYSQL_DATABASE: formularios
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app-network

volumes:
  mysql_data:

networks:
  app-network:
    external: true
```

Crear contenedor backend

```docker
version: "3.9"

services:
  backend:
    build: .
    container_name: backend
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: formularios
      DB_USER: root
      DB_PASSWORD: ""
    networks:
      - app-network

networks:
  app-network:
    external: true
```

Crear contenedor frontend

```docker
version: "3.9"

services:
  frontend:
    build: .
    container_name: frontend
    networks:
      - app-network

networks:
  app-network:
    external: true

```

Crear contenedor de nginx

```docker
version: "3.9"

services:
  nginx:
    image: nginx:latest
    container_name: nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - app-network

networks:
  app-network:
    external: true

```