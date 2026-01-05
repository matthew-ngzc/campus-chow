# Kong API Gateway for SMUnch

This repository contains the Kong API Gateway configuration for the SMUnch microservices architecture. Kong acts as the single entry point for all API requests, routing them to the appropriate microservices.

## 📋 Table of Contents

- [What is Kong?](#what-is-kong)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [First Time Setup](#first-time-setup)
- [Starting Services](#starting-services)
- [Testing the Gateway](#testing-the-gateway)
- [Adding Your Microservice](#adding-your-microservice)
- [Configuration Files](#configuration-files)
- [Troubleshooting](#troubleshooting)

## 🤔 What is Kong?

Kong is an API Gateway that sits between the frontend and backend microservices. It provides:

- **Single Entry Point**: Frontend only needs to know one URL (port 8000)
- **Request Routing**: Routes requests to the correct microservice
- **CORS Handling**: Handles Cross-Origin Resource Sharing
- **Rate Limiting**: Prevents API abuse (100 requests/minute)
- **Load Balancing**: Distributes traffic across service instances
- **Centralized Authentication**

## 🏗️ Architecture Overview

```
Frontend (React/Next.js)
         ↓
    Port 8000 (Kong API Gateway)
         ↓
    ┌────┴────┬─────────┬──────────┐
    ↓         ↓         ↓          ↓
Merchant  Menu    Orders    Payments ...
Service   Service Service   Service
:8082     :8083   :8084     :8085
```

**Current Services Registered:**
- Merchant Service (port 8082)
- Menu Service (port 8083)
- Order Service (port 8084)
- Payment Service (port 8085)

## ✅ Prerequisites

Before setting up Kong, ensure you have:

1. **Docker & Docker Compose** installed
2. **Shared Docker Network** created (see below)
3. **Your microservice** running with:
   - Its own `docker-compose.yml`
   - Connected to `smunch-network`
   - Exposed on a specific port (e.g., 8084, 8085, etc.)

## 🚀 First Time Setup

### Step 1: Create Shared Network

This network allows all services to communicate:

```bash
docker network create smunch-network
```

Verify it was created:
```bash
docker network inspect smunch-network
```

### Step 2: Clone This Repository

```bash
git clone https://gitlab.com/cs302-2025/g4-team2/services/kong.git
cd kong
```

### Step 3: Start Your Microservices

Each microservice needs to be connected to `smunch-network`. Example `docker-compose.yml`:

```yaml
version: '3.8'

services:
  your-service:
    build: .
    container_name: your-service-name
    ports:
      - "8084:8084"  # Your service port
    networks:
      - smunch-network
    restart: unless-stopped

networks:
  smunch-network:
    external: true  # Important: tells Docker to use existing network
```

Start your services:
```bash
cd merchant && docker-compose up -d
cd menu && docker-compose up -d
# ... start other services
```

### Step 4: Start Kong Gateway

```bash
cd kong  # This repository
docker-compose up -d
```

### Step 5: Verify Everything is Running

```bash
# Check all containers are running
docker ps

# Should see:
# - kong-gateway
# - merchant-service
# - menu-service
# - (your other services)

# Verify network connections
docker network inspect smunch-network

# Check Kong is healthy
curl http://localhost:8000
# Should return: {"message":"no Route matched with those values"}

# Check Kong admin API
curl http://localhost:8001/status
# Should return JSON with Kong status
```

## 🎮 Starting Services

### Start Everything

```bash
# Start your microservices first
cd merchant && docker-compose up -d
cd ../menu && docker-compose up -d

# Then start Kong
cd ../kong && docker-compose up -d
```

### Stop Everything

```bash
cd kong && docker-compose down
cd ../merchant && docker-compose down
cd ../menu && docker-compose down
```

### Restart Kong (after config changes)

```bash
cd kong
docker-compose restart kong

# Or full restart:
docker-compose down && docker-compose up -d
```

## 🧪 Testing the Gateway

### Test Through Kong (Port 8000)

```bash
# Get all merchants
curl http://localhost:8000/api/merchants

# Get specific merchant
curl http://localhost:8000/api/merchants/1

# Get menu for merchant
curl http://localhost:8000/api/merchants/1/menu

# Create merchant
curl -X POST http://localhost:8000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cafe",
    "location": "SMU",
    "contactNumber": "12345678"
  }'
```

### Test Direct to Service (For Debugging)

```bash
# Bypass Kong - talk directly to service
curl http://localhost:8082/api/merchants
curl http://localhost:8083/api/merchants/1/menu
```

If direct works but Kong doesn't, the issue is in Kong configuration.

## ➕ Adding Your Microservice

Follow these steps to add your microservice to Kong:

### Step 1: Ensure Your Service is on the Network

Update your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  order-service:  # Example: Orders Service
    build: .
    container_name: order-service
    ports:
      - "8084:8084"
    networks:
      - smunch-network  # Add this
    restart: unless-stopped

networks:
  smunch-network:
    external: true  # Add this
```

### Step 2: Add Service Definition to kong.yml

Edit `kong.yml` and add your service under the `services:` section:

```yaml
services:
  # Existing services...
  
  # Your new service
  - name: order-service
    url: http://order-service:8084  # container-name:port
    connect_timeout: 60000
    write_timeout: 60000
    read_timeout: 60000
```

### Step 3: Add Routes to kong.yml

Add your API routes under the `routes:` section:

```yaml
routes:
  # Existing routes...
  
  # Your new routes
  - name: get-all-orders
    service: order-service
    paths:
      - ~/api/orders$  # Note: ~ for regex, $ for exact match
    methods:
      - GET
    strip_path: false

  - name: create-order
    service: order-service
    paths:
      - ~/api/orders$
    methods:
      - POST
    strip_path: false

  - name: get-order-by-id
    service: order-service
    paths:
      - ~/api/orders/(?<id>[0-9]+)$  # Regex for numeric ID
    methods:
      - GET
    strip_path: false
```

### Step 4: Restart Kong

```bash
cd kong
docker-compose restart kong
```

### Step 5: Test Your Routes

```bash
# Test through Kong
curl http://localhost:8000/api/orders

# If it doesn't work, test direct to service first
curl http://localhost:8084/api/orders
```

## 📁 Configuration Files

### docker-compose.yml

Defines the Kong container and connects it to `smunch-network`.

**Important settings:**
- `KONG_DATABASE: "off"` - Uses declarative config (no database needed)
- `KONG_DECLARATIVE_CONFIG: /kong/kong.yml` - Points to config file
- Port 8000: API Gateway (public)
- Port 8001: Kong Admin API (management)

### kong.yml

Main configuration file with two sections:

**1. Services** - Backend microservices
```yaml
services:
  - name: merchant-service
    url: http://merchant-service:8082
```

**2. Routes** - API endpoints and routing rules
```yaml
routes:
  - name: get-all-merchants
    service: merchant-service
    paths:
      - ~/api/merchants$
    methods:
      - GET
```