# REST API Specification (`api_spec.md`)

This specification documents the REST API endpoints for **Statistic Public View**. All API endpoints accept and return JSON payloads (`Content-Type: application/json`) unless otherwise noted.

---

## 1. Authentication & Session Endpoints

### 1.1 Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Description**: Authenticates user credentials and establishes an HTTP-only session.
* **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "secretpassword"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
  ```
* **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "error": "Invalid username or password"
  }
  ```

### 1.2 Logout
* **Endpoint**: `POST /api/auth/logout`
* **Access**: Authenticated
* **Description**: Destroys the user's active session and clears the session cookie.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 1.3 Get Current User Identity
* **Endpoint**: `GET /api/auth/me`
* **Access**: Public / Authenticated
* **Description**: Returns the active session user identity if logged in.
* **Response (200 OK - Authenticated)**:
  ```json
  {
    "authenticated": true,
    "user": { "id": 1, "username": "admin", "role": "admin" }
  }
  ```
* **Response (200 OK - Guest/Public)**:
  ```json
  {
    "authenticated": false,
    "user": null
  }
  ```

---

## 2. Category Management (CRUD)

### 2.1 List All Categories
* **Endpoint**: `GET /api/categories`
* **Access**: Public
* **Description**: Returns all statistical datasets/categories available for viewing.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Public Transit Ridership 2026",
        "description": "Monthly bus and subway passenger metrics",
        "icon": "bus",
        "color_theme": "indigo",
        "created_at": "2026-07-01 10:00:00"
      }
    ]
  }
  ```

### 2.2 Create Category
* **Endpoint**: `POST /api/categories`
* **Access**: Admin Only (`role: 'admin'`)
* **Request Body**:
  ```json
  {
    "name": "Education Funding 2026",
    "description": "District-level school budget allocations",
    "icon": "academic-cap",
    "color_theme": "emerald"
  }
  ```

### 2.3 Update & Delete Category
* **Update Endpoint**: `PUT /api/categories/:id` (Admin Only)
* **Delete Endpoint**: `DELETE /api/categories/:id` (Admin Only)

---

## 3. Custom Schema Builder (Columns)

### 3.1 Get Category Schema
* **Endpoint**: `GET /api/columns/:category_id`
* **Access**: Public
* **Description**: Returns the ordered list of custom column definitions for a given category.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "category_id": 1,
        "column_name": "month",
        "column_label": "Month / Period",
        "data_type": "text",
        "is_required": 1,
        "sort_order": 10
      },
      {
        "id": 2,
        "category_id": 1,
        "column_name": "ridership_count",
        "column_label": "Total Passengers",
        "data_type": "number",
        "is_required": 1,
        "sort_order": 20
      }
    ]
  }
  ```

### 3.2 Add Custom Column
* **Endpoint**: `POST /api/columns`
* **Access**: Admin Only
* **Request Body**:
  ```json
  {
    "category_id": 1,
    "column_name": "on_time_percentage",
    "column_label": "On-Time Performance (%)",
    "data_type": "number",
    "is_required": false,
    "sort_order": 30
  }
  ```

### 3.3 Update & Delete Custom Column
* **Update Endpoint**: `PUT /api/columns/:id` (Admin Only)
* **Delete Endpoint**: `DELETE /api/columns/:id` (Admin Only)

---

## 4. Dynamic Data Records (EAV / JSON Rows)

### 4.1 List Data Records for Category
* **Endpoint**: `GET /api/records/:category_id`
* **Access**: Public
* **Query Parameters**:
  * `page` (optional, default: 1)
  * `limit` (optional, default: 50)
  * `search` (optional keyword search within JSON payload)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "pagination": { "page": 1, "limit": 50, "total": 12 },
    "data": [
      {
        "id": 101,
        "category_id": 1,
        "data": {
          "month": "January 2026",
          "ridership_count": 142000,
          "on_time_percentage": 94.5
        },
        "created_at": "2026-07-01 10:15:00"
      }
    ]
  }
  ```

### 4.2 Create Data Record
* **Endpoint**: `POST /api/records`
* **Access**: Admin Only
* **Request Body**:
  ```json
  {
    "category_id": 1,
    "data": {
      "month": "February 2026",
      "ridership_count": 158000,
      "on_time_percentage": 96.2
    }
  }
  ```

### 4.3 Update & Delete Data Record
* **Update Endpoint**: `PUT /api/records/:id` (Admin Only)
* **Delete Endpoint**: `DELETE /api/records/:id` (Admin Only)

---

## 5. Chart Visualization Configuration

### 5.1 Get Chart Configuration
* **Endpoint**: `GET /api/charts/:category_id`
* **Access**: Public
* **Description**: Returns the chart settings for rendering Chart.js visualizations.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "category_id": 1,
      "chart_type": "bar",
      "x_axis_column": "month",
      "y_axis_column": "ridership_count",
      "group_by_column": null,
      "palette": "indigo-gradient",
      "title": "Monthly Public Transit Ridership (2026)"
    }
  }
  ```

### 5.2 Save or Update Chart Configuration
* **Endpoint**: `POST /api/charts/:category_id` (Upsert behavior)
* **Access**: Admin Only
* **Request Body**:
  ```json
  {
    "chart_type": "line",
    "x_axis_column": "month",
    "y_axis_column": "on_time_percentage",
    "palette": "emerald-gradient",
    "title": "Monthly On-Time Performance Trend"
  }
  ```
