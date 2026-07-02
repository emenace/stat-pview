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

## 2. Category & Sub-Category Management (CRUD)

### 2.1 List All Categories
* **Endpoint**: `GET /api/categories`
* **Access**: Public
* **Description**: Returns all top-level statistical categories (Icon + Title only) along with their nested sub-categories.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Data Rumah Ibadah",
        "icon": "building",
        "color_theme": "emerald",
        "created_at": "2026-07-01 10:00:00",
        "sub_categories": [
          { "id": 1, "category_id": 1, "name": "Data Masjid", "sort_order": 10 }
        ]
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
    "name": "Tanah Wakaf",
    "icon": "map",
    "color_theme": "emerald"
  }
  ```

### 2.3 Update & Delete Category
* **Update Endpoint**: `PUT /api/categories/:id` (Admin Only)
* **Delete Endpoint**: `DELETE /api/categories/:id` (Admin Only - Cascades to all sub-categories and data)

### 2.4 Sub-Category Endpoints
* **List Sub-Categories**: `GET /api/subcategories/:category_id` (Public)
* **Create Sub-Category**: `POST /api/subcategories` (Admin Only) - Body: `{ "category_id": 1, "name": "Data Mushollah", "sort_order": 20 }`
* **Update Sub-Category**: `PUT /api/subcategories/:id` (Admin Only)
* **Delete Sub-Category**: `DELETE /api/subcategories/:id` (Admin Only - Cascades to columns, records, and chart configs)

---

## 3. Custom Schema Builder (Columns)

### 3.1 Get Sub-Category Schema
* **Endpoint**: `GET /api/columns/:category_id` (Note: `:category_id` represents `sub_category_id` in URL routing)
* **Access**: Public
* **Description**: Returns the ordered list of custom column definitions for a given sub-category.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "sub_category_id": 1,
        "column_name": "nama_masjid",
        "column_label": "Nama Masjid",
        "data_type": "text",
        "is_required": 1,
        "sort_order": 10
      },
      {
        "id": 2,
        "sub_category_id": 1,
        "column_name": "jamaah",
        "column_label": "Jumlah Jamaah",
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
    "sub_category_id": 1,
    "column_name": "status",
    "column_label": "Status Tanah",
    "data_type": "text",
    "is_required": false,
    "sort_order": 30
  }
  ```

### 3.3 Update & Delete Custom Column
* **Update Endpoint**: `PUT /api/columns/:id` (Admin Only)
* **Delete Endpoint**: `DELETE /api/columns/:id` (Admin Only)

---

## 4. Dynamic Data Records (EAV / JSON Rows)

### 4.1 List Data Records for Sub-Category
* **Endpoint**: `GET /api/records/:category_id` (Note: `:category_id` represents `sub_category_id` in URL routing)
* **Access**: Public
* **Query Parameters**:
  * `page` (optional, default: 1)
  * `limit` (optional, default: 50)
  * `search` (optional keyword search within JSON payload)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "pagination": { "page": 1, "limit": 50, "total": 8 },
    "data": [
      {
        "id": 101,
        "sub_category_id": 1,
        "data": {
          "nama_masjid": "Masjid Taqwa Metro",
          "kecamatan": "Metro Pusat",
          "jamaah": 500
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
    "sub_category_id": 1,
    "data": {
      "nama_masjid": "Masjid Al-Muhajirin",
      "kecamatan": "Metro Timur",
      "jamaah": 310
    }
  }
  ```

### 4.3 Update & Delete Data Record
* **Update Endpoint**: `PUT /api/records/:id` (Admin Only)
* **Delete Endpoint**: `DELETE /api/records/:id` (Admin Only)

---

## 5. Chart Visualization Configuration

### 5.1 Get Chart Configuration
* **Endpoint**: `GET /api/charts/:category_id` (Note: `:category_id` represents `sub_category_id` in URL routing)
* **Access**: Public
* **Description**: Returns the chart settings for rendering Chart.js visualizations for a sub-category.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "config": {
        "id": 1,
        "sub_category_id": 1,
        "chart_type": "bar",
        "x_axis_column": "nama_masjid",
        "y_axis_column": "jamaah",
        "group_by_column": null,
        "palette": "emerald",
        "title": "Jumlah Jamaah Masjid di Kota Metro"
      },
      "chartData": {
        "labels": ["Masjid Taqwa Metro", "Masjid Al-Muhajirin"],
        "values": [500, 310]
      }
    }
  }
  ```

### 5.2 Save or Update Chart Configuration
* **Endpoint**: `POST /api/charts/:category_id` (Upsert behavior, `:category_id` represents `sub_category_id`)
* **Access**: Admin Only
* **Request Body**:
  ```json
  {
    "chart_type": "pie",
    "x_axis_column": "peruntukan",
    "y_axis_column": "luas",
    "palette": "emerald",
    "title": "Distribusi Luas Tanah Wakaf berdasarkan Peruntukan"
  }
  ```
