## Endpoints Overview

| Method | Endpoint | Description |
|---------|-----------|-------------|
| **GET** | `/api/merchants/{merchantId}/menu` | Retrieve all menu items for a merchant |
| **POST** | `/api/merchants/{merchantId}/menu` | Create a new menu item for a merchant |
| **PUT** | `/api/merchants/{merchantId}/menu/{menuItemId}` | Update an existing menu item |
| **GET** | `/api/merchants/{merchantId}/menu/items` | Retrieve specific menu items by their IDs |

---

## GET `/api/merchants/{merchantId}/menu`

#### Description
Retrieve all menu items belonging to a specific merchant.  
Supports an optional query parameter to include unavailable menu items.

#### Query Parameters
| Parameter | Type | Default | Description |
|------------|------|----------|-------------|
| `includeUnavailable` | `boolean` | `false` | If `true`, includes menu items marked as unavailable. |

#### Example Request
```
GET /api/merchants/2/menu
```

```
GET /api/merchants/2/menu?includeUnavailable=true
```

---

## POST `/api/merchants/{merchantId}/menu`

#### Description
Creates a new menu item under a specific merchant.  
Each merchant can have multiple menu items.  
The `merchantId` path variable links the item to the correct merchant.

#### Example Request
```
POST /api/merchants/2/menu
```

#### Request Body
```json
{
  "name": "Chicken Rice",
  "description": "Delicious chicken rice",
  "priceCents": 550,
  "imageUrl": "https://example.com/chicken-rice.jpg",
  "type": "food",
  "availabilityStatus": "available"
}
```

---

## PUT `/api/merchants/{merchantId}/menu/{menuItemId}`

#### Description
Updates an existing menu item for a specific merchant.  
This is a **partial update** – only fields provided in the request body will be updated.  
Both `merchantId` and `menuItemId` must be valid for the update to succeed.

#### Example Request
```
PUT /api/merchants/2/menu/3
```

#### Request Body
```json
{
  "priceCents": 600,
  "availabilityStatus": "out_of_stock"
}
```

---

## GET `/api/merchants/{merchantId}/menu/items`

#### Description
Retrieve specific menu items by their IDs for a given merchant.  
This endpoint is useful for batch lookups (e.g., when processing orders).  
**All requested item IDs must exist and belong to the specified merchant**, otherwise a `404 Not Found` error is returned.

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `itemIds` | `array of Long` | Yes | List of menu item IDs to retrieve |

#### Example Request
```
GET /api/merchants/1/menu/items
```

#### Request Body
```json
{
  "itemIds": [1, 2, 3]
}
```

#### Response (Success - 200 OK)
```json
{
  "items": [
    {
      "itemId": 1,
      "name": "Chicken Rice",
      "priceCents": 550,
      "available": true
    },
    {
      "itemId": 2,
      "name": "Duck Rice",
      "priceCents": 600,
      "available": true
    },
    {
      "itemId": 3,
      "name": "Iced Milo",
      "priceCents": 300,
      "available": false
    }
  ]
}
```

#### Response (Error - 404 Not Found)
If any requested item IDs don't exist or don't belong to the merchant:
```json
{
  "error": "Menu Item(s) not found with IDs=[4, 5] for merchantId=1"
}
```

#### Notes
- The `available` field is derived from `availabilityStatus`: `true` if status is `"available"`, `false` otherwise
- Only items belonging to the specified `merchantId` are returned
- If any item ID is missing or belongs to a different merchant, the entire request fails with a 404 error