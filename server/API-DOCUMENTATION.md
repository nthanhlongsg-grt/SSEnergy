# API Documentation - SGE After-Sales Management System

Base URL: `http://localhost:3000/api`

## Authentication

Tất cả các endpoints (trừ `/auth/login`) đều yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST /api/auth/login
Đăng nhập

**Request Body:**
```json
{
  "email": "admin@SGE.vn",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn Admin",
    "email": "admin@SGE.vn",
    "role": "admin"
  }
}
```

### GET /api/auth/me
Lấy thông tin user hiện tại

---

## Users Endpoints

### GET /api/users
Lấy danh sách users (Admin only)

### GET /api/users/:id
Lấy thông tin user theo ID

### POST /api/users
Tạo user mới (Admin only)

**Request Body:**
```json
{
  "name": "Tên người dùng",
  "email": "email@example.com",
  "password": "password123",
  "role": "technician",
  "code": "USR001",
  "organization": "Tổ chức",
  "status": "active"
}
```

### PUT /api/users/:id
Cập nhật user (Admin only)

### DELETE /api/users/:id
Xóa user (Admin only)

---

## Customers Endpoints

### GET /api/customers
Lấy danh sách customers

**Query Parameters:**
- `search` - Tìm kiếm theo tên, email, phone
- `customer_type` - Loại khách hàng (enterprise, residential)
- `page` - Trang (mặc định: 1)
- `limit` - Số lượng mỗi trang (mặc định: 50)

### GET /api/customers/:id
Lấy thông tin customer theo ID (bao gồm danh sách inverters)

### POST /api/customers
Tạo customer mới

**Request Body:**
```json
{
  "name": "Tên khách hàng",
  "email": "email@example.com",
  "phone": "0901234567",
  "address": "Địa chỉ",
  "customer_type": "enterprise",
  "organization": "Tên công ty",
  "tax_code": "1234567890"
}
```

### PUT /api/customers/:id
Cập nhật customer

### DELETE /api/customers/:id
Xóa customer (Admin only)

---

## Inverters Endpoints

### GET /api/inverters
Lấy danh sách inverters

**Query Parameters:**
- `search` - Tìm kiếm
- `model` - Lọc theo model
- `status` - Lọc theo trạng thái
- `customer_id` - Lọc theo customer
- `serial_number` - Tìm theo serial number

### GET /api/inverters/:id
Lấy thông tin inverter theo ID (bao gồm tickets và history)

### POST /api/inverters
Tạo inverter mới

**Request Body:**
```json
{
  "serial_number": "INV-2024-001",
  "model": "MAX 10KTL3-X",
  "power_rating": "10kW",
  "installation_date": "2024-01-15",
  "warranty_start_date": "2024-01-15",
  "warranty_end_date": "2034-01-15",
  "customer_id": 1,
  "distributor_id": 1
}
```

### PUT /api/inverters/:id
Cập nhật inverter

### DELETE /api/inverters/:id
Xóa inverter (Admin only)

---

## Tickets Endpoints

### GET /api/tickets
Lấy danh sách tickets

**Query Parameters:**
- `search` - Tìm kiếm
- `status` - Lọc theo trạng thái
- `priority` - Lọc theo độ ưu tiên
- `assigned_to` - Lọc theo người được phân công
- `customer_id` - Lọc theo customer
- `inverter_id` - Lọc theo inverter

### GET /api/tickets/:id
Lấy thông tin ticket theo ID (bao gồm comments, attachments, service reports)

### POST /api/tickets
Tạo ticket mới

**Request Body:**
```json
{
  "customer_id": 1,
  "inverter_id": 1,
  "title": "Tiêu đề ticket",
  "description": "Mô tả vấn đề",
  "priority": "high",
  "category": "warranty"
}
```

### PUT /api/tickets/:id
Cập nhật ticket

### POST /api/tickets/:id/comments
Thêm comment vào ticket

**Request Body:**
```json
{
  "comment": "Nội dung comment"
}
```

### DELETE /api/tickets/:id
Xóa ticket (Admin, Service Center only)

---

## Service Reports Endpoints

### GET /api/service-reports
Lấy danh sách service reports

**Query Parameters:**
- `ticket_id` - Lọc theo ticket
- `technician_id` - Lọc theo kỹ thuật viên
- `status` - Lọc theo trạng thái

### GET /api/service-reports/:id
Lấy thông tin service report theo ID (bao gồm parts used)

### POST /api/service-reports
Tạo service report mới

**Request Body:**
```json
{
  "ticket_id": 1,
  "technician_id": 3,
  "service_date": "2024-01-20",
  "service_start_time": "09:00",
  "service_end_time": "12:00",
  "service_type": "repair",
  "description": "Mô tả dịch vụ",
  "diagnosis": "Chẩn đoán",
  "actions_taken": "Hành động đã thực hiện",
  "parts": [
    {
      "part_id": 1,
      "quantity": 2,
      "unit_price": 2500000
    }
  ],
  "labor_cost": 500000
}
```

### PUT /api/service-reports/:id
Cập nhật service report

### DELETE /api/service-reports/:id
Xóa service report (Admin, Service Center only)

---

## Warehouse Endpoints

### GET /api/warehouse/parts
Lấy danh sách parts

**Query Parameters:**
- `search` - Tìm kiếm
- `category` - Lọc theo danh mục
- `status` - Lọc theo trạng thái
- `low_stock` - Chỉ lấy items sắp hết hàng (true/false)

### GET /api/warehouse/parts/:id
Lấy thông tin part theo ID (bao gồm transaction history)

### POST /api/warehouse/parts
Tạo part mới (Admin, Warehouse only)

**Request Body:**
```json
{
  "part_number": "PN-001",
  "name": "Tên linh kiện",
  "category": "Electronics",
  "quantity": 100,
  "min_quantity": 20,
  "unit_price": 2500000,
  "supplier": "Nhà cung cấp"
}
```

### PUT /api/warehouse/parts/:id
Cập nhật part (Admin, Warehouse only)

### POST /api/warehouse/parts/:id/inventory
Cập nhật tồn kho (nhập/xuất)

**Request Body:**
```json
{
  "transaction_type": "in",  // in, out, import, export, use, return
  "quantity": 10,
  "unit_price": 2500000,
  "notes": "Nhập kho từ nhà cung cấp"
}
```

### GET /api/warehouse/rma
Lấy danh sách RMA requests

### POST /api/warehouse/rma
Tạo RMA request mới

### PUT /api/warehouse/rma/:id
Cập nhật RMA request (Admin, Service Center, Warehouse only)

---

## Schedules Endpoints

### GET /api/schedules
Lấy danh sách schedules

**Query Parameters:**
- `technician_id` - Lọc theo kỹ thuật viên
- `date` - Lọc theo ngày (YYYY-MM-DD)
- `status` - Lọc theo trạng thái

### GET /api/schedules/:id
Lấy thông tin schedule theo ID

### POST /api/schedules
Tạo schedule mới (Admin, Service Center only)

**Request Body:**
```json
{
  "technician_id": 3,
  "ticket_id": 1,
  "title": "Kiểm tra và sửa chữa",
  "schedule_date": "2024-01-25",
  "start_time": "09:00",
  "end_time": "12:00",
  "location": "Địa chỉ"
}
```

### PUT /api/schedules/:id
Cập nhật schedule

### DELETE /api/schedules/:id
Xóa schedule (Admin, Service Center only)

---

## Dashboard Endpoints

### GET /api/dashboard/stats
Lấy thống kê dashboard

**Response:**
```json
{
  "totals": {
    "tickets": 150,
    "customers": 50,
    "inverters": 200,
    "service_reports": 80
  },
  "tickets_by_status": [...],
  "tickets_by_priority": [...],
  "recent_tickets": [...],
  "low_stock_parts": [...]
}
```

---

## Error Responses

Tất cả các endpoints có thể trả về các lỗi sau:

- `400 Bad Request` - Dữ liệu request không hợp lệ
- `401 Unauthorized` - Chưa đăng nhập hoặc token không hợp lệ
- `403 Forbidden` - Không có quyền truy cập
- `404 Not Found` - Không tìm thấy resource
- `500 Internal Server Error` - Lỗi server

**Error Response Format:**
```json
{
  "error": "Error message"
}
```
