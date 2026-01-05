# User Service (Campus Chow)

This folder contains the **User microservice** for Campus Chow.  
It handles user registration/login, profile management, and avatar uploads.  
It is fully connected to the frontend via Kong.

---

## 🚀 Run

From this `user/` folder:

```bash
docker network create smunch-network   # only if not created before
docker compose up -d --build
Services started:

user-postgres → localhost:5437

user-service → localhost:8087

Stop:

bash
Copy code
docker compose down
Reset DB (fresh empty DB):

bash
Copy code
docker compose down -v
The DB starts empty. Tables are created automatically on first run.

🔌 Local API (Direct Access)
Base URL (bypassing Kong):

text
Copy code
http://localhost:8087
Main endpoints:

GET /api/user/health – health check

POST /api/user/auth/register – register user

POST /api/user/auth/login – login, returns JWT

GET /uploads/... – serve avatar images

Protected user routes (JWT required) under:

/api/users...

/api/user/management...

🐳 What's Included
src/

config/db.js – Postgres connection

models/User.js – user model

controllers/*.js – auth, user, management logic

routes/*.js – Express routes

middlewares/*.js – auth/JWT & admin checks

uploads/avatars – stored avatar files (bound via volume)

docker-compose.yml – Postgres + Node service

Dockerfile – Node 20, production runtime

Key container env (set via docker-compose.yml):

env
Copy code
PORT=8087
DB_HOST=user-postgres
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=smunch_user
JWT_SECRET=dev-secret-change-me-1234567890-abcdef
JWT_ISSUER=auth-service
JWT_EXPIRES=1d
Avatars are persisted via:

yaml
Copy code
- ./src/uploads:/app/src/uploads
🌐 When Used with Kong + Frontend
In the full system, the frontend calls the user service through Kong using paths like:

/api/user/health

/api/user/auth/register

/api/user/auth/login

/api/users...

/api/user/management...

/uploads/... (serve profile avatars)

Inside the Docker network, Kong reaches this service at:

text
Copy code
http://user-service:8087