## Endpoints Overview

| Method | Endpoint | Description |
|---------|-----------|-------------|
| **GET** | `/api/merchants` | Retrieve merchants (all, by parentId, or top-level only) |
| **GET** | `/api/merchants/{id}` | Retrieve a merchant by ID |
| **POST** | `/api/merchants` | Create a new merchant |
| **PATCH** | `/api/merchants/{id}` | Partially update an existing merchant |

---

## Endpoints Details

### GET `/api/merchants`

#### Description
Retrieves a list of merchants. Supports filtering by parentId.

#### Query Parameters
| Parameter | Type | Description |
|------------|------|-------------|
| `parentId` | `String` _(optional)_ | - If omitted → returns **all merchants**.<br> - If set to `"null"` → returns **top-level merchants** (those without a parent).<br> - If set to a number (e.g. `1`) → returns **child merchants** of that parent ID. |

#### Example Requests
GET /api/merchants

GET /api/merchants?parentId=null

GET /api/merchants?parentId=1


### GET `/api/merchants/{id}`

#### Description
Retrieve a single merchant by its unique ID.  
This endpoint returns detailed information about the merchant, including whether it has any child merchants.

#### Example Request
GET /api/merchants/5

### POST `/api/merchants`

#### Description
Create a new merchant entry in the system.  
This endpoint allows the creation of a new merchant, optionally specifying a parent merchant to form a hierarchy.  

#### Example Request
POST /api/merchants

### PATCH `/api/merchants/{id}`

#### Description
Update an existing merchant’s details partially.  
Only the fields included in the request body will be updated — unspecified fields remain unchanged.  

#### Example Request
PATCH /api/merchants/6





