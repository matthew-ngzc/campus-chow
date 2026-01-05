#  SMUNCH Runners Microservice 

### 1. Clone the repository

```bash
git clone https://gitlab.com/cs302-2025/g4-team2/services/runners.git
cd orders
```


### 2. Start Docker 
- start docker desktop
```bash
docker compose up --build
```

- command to stop
```bash
docker compose down
```

# Runner Availability API

## Overview
REST API for managing runner availability timeslots. Supports setting, updating, and querying runner availability schedules with JWT authentication.

## Base URL
```
/api/runners/availability
```

## Authentication
All endpoints (except public queries) require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Set Availability
Set runner's availability for specified timeslots.

**Endpoint:** `POST /api/runners/availability`

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
[
  {
    "date": "2025-11-15",
    "startTime": "09:00",
    "endTime": "10:00"
  },
  {
    "date": "2025-11-15",
    "startTime": "14:00",
    "endTime": "15:00"
  }
]
```

**Response:**
```
Availability set successfully for {runnerId}{runnerEmail}
```

---

### 2. Set Today's Availability
Set runner's availability for today only.

**Endpoint:** `POST /api/runners/availability/today`

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
[
  {
    "startTime": "09:00",
    "endTime": "10:00"
  },
  {
    "startTime": "14:00",
    "endTime": "15:00"
  }
]
```

**Response:**
```
Availability set successfully for {runnerId}{runnerEmail}
```

---

### 3. Remove Availability
Remove specific timeslots from runner's availability.

**Endpoint:** `PATCH /api/runners/availability/{runnerId}/remove`

**Path Parameters:**
- `runnerId` (Long) - ID of the runner

**Request Body:**
```json
[
  {
    "date": "2025-11-15",
    "startTime": "09:00",
    "endTime": "10:00"
  }
]
```

**Response:**
```
Removed timeslots successfully for {runnerId}
```

---

### 4. Remove Today's Availability
Remove specific timeslots from today's availability.

**Endpoint:** `PATCH /api/runners/availability/{runnerId}/remove/today`

**Path Parameters:**
- `runnerId` (Long) - ID of the runner

**Request Body:**
```json
[
  {
    "startTime": "09:00",
    "endTime": "10:00"
  }
]
```

**Response:**
```
Removed timeslots successfully for {runnerId}
```

---

### 5. Get Availability by Date
Retrieve runner's availability for a specific date.

**Endpoint:** `GET /api/runners/availability/{date}`

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `date` (LocalDate) - Date in format `YYYY-MM-DD`

**Response:**
```json
[
  {
    "date": "2025-11-15",
    "startTime": "09:00",
    "endTime": "10:00"
  },
  {
    "date": "2025-11-15",
    "startTime": "14:00",
    "endTime": "15:00"
  }
]
```

---

### 6. Get Available Runners
Get all runners available for a specific date and timeslot (public endpoint).

**Endpoint:** `GET /api/runners/availability/available/{date}/{timeslot}`

**Path Parameters:**
- `date` (LocalDate) - Date in format `YYYY-MM-DD`
- `timeslot` (Timeslot) - Timeslot object (format depends on your implementation)

**Response:**
```json
[101, 102, 103, 105]
```

---

## Models

### Timeslot
```java
{
  "date": "2025-11-15",      // LocalDate (YYYY-MM-DD)
  "startTime": "09:00",      // LocalTime (HH:mm)
  "endTime": "10:00"         // LocalTime (HH:mm)
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Invalid or missing JWT token"
}
```

### 404 Not Found
```json
{
  "error": "Runner not found"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid timeslot format"
}
```

---

## Dependencies
- Spring Boot Web
- Spring Security (JWT authentication)
- JwtUtils for token extraction
- RunnerAvailabilityService for business logic

---

## Notes
- Dates should be in ISO-8601 format: `YYYY-MM-DD`
- Times should be in 24-hour format: `HH:mm`
- Runner ID and email are extracted from JWT token for authenticated endpoints
- The `/available/{date}/{timeslot}` endpoint is public and doesn't require authentication

---

## Example Usage

### cURL Example
```bash
# Set availability
curl -X POST http://localhost:8080/api/runners/availability \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '[{"date":"2025-11-15","startTime":"09:00","endTime":"10:00"}]'

# Get availability by date
curl -X GET http://localhost:8080/api/runners/availability/2025-11-15 \
  -H "Authorization: Bearer eyJhbGc..."

# Get available runners
curl -X GET http://localhost:8080/api/runners/availability/available/2025-11-15/MORNING
```

## Runner Assignment Endpoints

### Base Path: `/api/runners/assign`

### 10. Assign Orders to Runners
Automatically assign pending orders to available runners for a given timeslot.

**Endpoint:** `POST /api/runners/assign`

**Query Parameters:**
- `timeslot` (Timeslot) - Required. Timeslot to assign orders for
- `date` (LocalDate) - Optional. Target date (defaults to today if not provided)

**Example:**
```
POST /api/runners/assign?timeslot=MORNING&date=2025-11-15
```

**Response (Success):**
```
Assigned 5 orders for MORNING
```

**Response (No Orders):**
```
No pending orders to assign for MORNING
```

**Response (Error - 500):**
```json
{
  "error": "Error assigning orders: {error_message}"
}
```

---

### 11. Get My Assigned Orders
Get all orders assigned to the authenticated runner.

**Endpoint:** `GET /api/runners/assign/my-orders`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `date` (LocalDate) - Optional. Target date (defaults to today if not provided)

**Example:**
```
GET /api/runners/assign/my-orders?date=2025-11-15
```

**Response:**
```json
[
  {
    "id": 1,
    "customerId": 501,
    "deliveryTime": "2025-11-15T09:30:00",
    "timeslot": "MORNING",
    "status": "ASSIGNED",
    "assignedRunnerId": 101
  },
  {
    "id": 3,
    "customerId": 503,
    "deliveryTime": "2025-11-15T10:00:00",
    "timeslot": "MORNING",
    "status": "ASSIGNED",
    "assignedRunnerId": 101
  }
]
```

---

### 12. Reset All Assignments
Clear all runner assignments and reset all orders to pending status.

**Endpoint:** `DELETE /api/runners/assign/reset`

**Response:**
```
All assignments cleared and pending orders reset.
```

---

## Models

### Timeslot
```java
{
  "date": "2025-11-15",      // LocalDate (YYYY-MM-DD)
  "startTime": "09:00",      // LocalTime (HH:mm)
  "endTime": "10:00"         // LocalTime (HH:mm)
}
```

### PendingOrder
```java
{
  "id": 1,
  "customerId": 501,
  "deliveryTime": "2025-11-15T09:30:00",  // LocalDateTime (ISO-8601)
  "timeslot": "MORNING",                   // Enum or String
  "status": "PENDING",                     // PENDING, ASSIGNED, COMPLETED
  "assignedRunnerId": null                 // Long (null if unassigned)
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Invalid or missing JWT token"
}
```

### 404 Not Found
```json
{
  "error": "Runner not found"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid timeslot format"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error assigning orders: {detailed_message}"
}
```

---

## Dependencies
- Spring Boot Web
- Spring Security (JWT authentication)
- Spring Data JPA
- JwtUtils for token extraction
- RunnerAvailabilityService, PendingOrderService, RunnerAssignmentService


## Example Usage

### cURL Examples

**Set Availability:**
```bash
curl -X POST http://localhost:8080/api/runners/availability \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '[{"date":"2025-11-15","startTime":"09:00","endTime":"10:00"}]'
```

**Get Availability by Date:**
```bash
curl -X GET http://localhost:8080/api/runners/availability/2025-11-15 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Get All Pending Orders:**
```bash
curl -X GET http://localhost:8080/api/orders/pending
```

**Get Pending Orders by Timeslot:**
```bash
curl -X GET http://localhost:8080/api/orders/pending/MORNING
```

**Get Pending Orders by Delivery Time:**
```bash
curl -X GET "http://localhost:8080/api/orders/pending/delivery-time?start=2025-11-15T09:00:00&end=2025-11-15T17:00:00"
```

**Assign Orders:**
```bash
curl -X POST "http://localhost:8080/api/runners/assign?timeslot=MORNING&date=2025-11-15"
```

**Get My Assigned Orders:**
```bash
curl -X GET "http://localhost:8080/api/runners/assign/my-orders?date=2025-11-15" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Reset All Assignments:**
```bash
curl -X DELETE http://localhost:8080/api/runners/assign/reset
```

**Get Available Runners:**
```bash
curl -X GET http://localhost:8080/api/runners/availability/available/2025-11-15/MORNING
```



