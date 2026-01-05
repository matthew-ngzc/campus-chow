min Service (Campus Chow)

This folder contains the Admin microservice and its PostgreSQL database.
Everything can be run locally with Docker. 
Note: The database starts empty on first run.
You can create the first admin account using
POST /api/admin/auth/register, admin cannot be register through front end because its use internally.

🚀 Run
docker network create smunch-network   # only needed once
docker compose up -d --build


Services started:

admin-postgres → localhost:5436

admin-service → localhost:8086

Stop:

docker compose down


Reset DB:

docker compose down -v

🔌 Endpoints (Direct Access)

Base URL: http://localhost:8086

Method	Path	Description
GET	/api/admin/health	health check
POST	/api/admin/auth/register	register admin
POST	/api/admin/auth/login	login (returns JWT)
ANY	/api/admin/**	protected (JWT required)
🐳 What’s included

Spring Boot source (src/main/java/...)

docker-compose.yml (DB + service)

Dockerfile (Maven build → Java runtime)

Uses smunch-network to connect with other microservices/Kong in the full system.

🌐 When used with Kong

Kong routes traffic to:

/api/admin/health
/api/admin/auth/register
/api/admin/auth/login
/api/admin/**


Admin microservice URL inside the network:

http://admin-service:8086

Postman for registration:
{
			"name": "admin-register",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "Content-Type",
						"value": "application/json",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\"email\":\"test111@x.com\",\"password\":\"abc123@111\"}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:8000/api/admin/auth/register",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "8000",
					"path": [
						"api",
						"admin",
						"auth",
						"register"
					]
				}
			},
			"response": []
		},