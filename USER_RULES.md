# Quy Tắc và Quyền Hạn của User trong Hệ Thống Growatt

## 1. Các User Role

Hệ thống có **9 loại user role**:

1. **ADMIN** (`admin`) - Quản trị viên
2. **DEV** (`dev`) - Developer
3. **SERVICE_CENTER** (`service_center`) - Trung tâm dịch vụ
4. **TECHNICIAN** (`technician`) - Kỹ thuật viên
5. **DISTRIBUTOR** (`distributor`) - Nhà phân phối
6. **DEALER** (`dealer`) - Đại lý
7. **END_USER** (`end_user`) - Khách hàng cuối
8. **WAREHOUSE** (`warehouse`) - Kho

## 2. Phân Nhóm User

### 2.1. Customer Group (Nhóm Khách hàng)
- **END_USER** - Khách hàng cuối
- **DISTRIBUTOR** - Nhà phân phối
- **Layout**: `CustomerLayout`
- **Route prefix**: `/customer/*`

### 2.2. Management Group (Nhóm Quản lý)
- **ADMIN** - Quản trị viên
- **DEV** - Developer
- **SERVICE_CENTER** - Trung tâm dịch vụ
- **TECHNICIAN** - Kỹ thuật viên
- **WAREHOUSE** - Kho
- **DEALER** - Đại lý
- **Layout**: Tùy theo role (AdminLayout, TechnicianLayout, etc.)
- **Route prefix**: `/` (root)

## 3. Quyền Hạn (Permissions) theo Role

### 3.1. ADMIN & DEV
**Quyền**: Tất cả permissions (full access)
- Xem và quản lý tất cả dữ liệu
- Không bị giới hạn bởi data filtering
- Có thể xem tất cả tickets, inverters, customers
- Có thể tạo, sửa, xóa mọi thứ

### 3.2. SERVICE_CENTER
**Quyền**:
- ✅ Xem thiết bị (inverters)
- ✅ Quản lý models
- ✅ Xem khách hàng
- ✅ Xem tickets
- ✅ Tạo ticket
- ✅ Phân công ticket
- ✅ Cập nhật trạng thái ticket
- ✅ Đóng ticket
- ✅ Xem kỹ thuật viên
- ✅ Phân công kỹ thuật viên
- ✅ Xem lịch làm việc
- ✅ Xem kho
- ✅ Xem báo cáo
- ✅ Tạo/sửa/xuất báo cáo
- ✅ Xem analytics
- ✅ Xuất dữ liệu

**Data Access**: Xem tất cả tickets (không bị filter)

### 3.3. TECHNICIAN
**Quyền**:
- ✅ Xem thiết bị (inverters)
- ✅ Quản lý models
- ✅ Xem khách hàng
- ✅ Xem tickets
- ✅ Cập nhật trạng thái ticket
- ✅ Xem lịch làm việc
- ✅ Xem báo cáo
- ✅ Tạo/sửa báo cáo

**Data Access Rules**:
- **Tickets**: Chỉ xem được:
  - Tickets được giao cho họ (`assigned_to = user.id`)
  - Tickets họ tạo (`created_by = user.id`)
  - Tickets họ đang theo dõi (watchers)
- **Inverters**: Xem tất cả (không bị filter)
- **Customers**: Xem tất cả (không bị filter)

### 3.4. DISTRIBUTOR
**Quyền**:
- ✅ Xem thiết bị (inverters)
- ✅ Tạo thiết bị mới
- ✅ Xem tickets
- ✅ Tạo ticket

**Data Access Rules**:
- **Tickets**: Xem được:
  - Tickets họ tạo
  - Tickets được giao cho họ
  - Tickets của end users được liên kết với họ (qua `parent_distributor_id`)
  - Tickets cho inverters của họ và end users liên kết
  - Tickets họ đang theo dõi (watchers)
- **Inverters**: Xem được:
  - Inverters của họ (`user_id = user.id`)
  - Inverters của end users được liên kết với họ

### 3.5. DEALER
**Quyền**:
- ✅ Xem thiết bị (inverters)
- ✅ Xem khách hàng
- ✅ Tạo khách hàng mới
- ✅ Xem tickets
- ✅ Tạo ticket
- ✅ Xem báo cáo

**Data Access**: Không có quyền xem tickets (bị filter `AND 1=0`)

### 3.6. END_USER
**Quyền**:
- ✅ Xem thiết bị (inverters)
- ✅ Tạo thiết bị mới
- ✅ Xem tickets
- ✅ Tạo ticket

**Data Access Rules**:
- **Tickets**: Xem được:
  - Tickets họ tạo (`created_by = user.id`)
  - Tickets được giao cho họ (`assigned_to = user.id`)
  - Tickets cho inverters của họ (`inverter.user_id = user.id`)
  - Tickets họ đang theo dõi (watchers)
- **Inverters**: Chỉ xem được inverters của họ (`user_id = user.id`)

### 3.7. WAREHOUSE
**Quyền**:
- ✅ Xem kho
- ✅ Quản lý linh kiện (parts)
- ✅ Quản lý RMA
- ✅ Import/Export linh kiện
- ✅ Xem tickets

**Data Access**: Không có quyền xem tickets (bị filter `AND 1=0`)

## 4. Data Filtering Rules

### 4.1. Tickets Filtering

#### ADMIN, DEV, SERVICE_CENTER
- **Không bị filter**: Xem tất cả tickets

#### TECHNICIAN
- **Filter**: `assigned_to = user.id OR created_by = user.id OR EXISTS (watchers)`
- Chỉ xem tickets được giao, tickets họ tạo, hoặc tickets họ đang theo dõi

#### END_USER
- **Filter**: `created_by = user.id OR assigned_to = user.id OR EXISTS (inverters.user_id = user.id) OR EXISTS (watchers)`
- Xem tickets họ tạo, tickets được giao, tickets cho inverters của họ, hoặc tickets họ đang theo dõi

#### DISTRIBUTOR
- **Filter**: 
  - Nếu có linked end users: `created_by IN (distributor_id, ...end_user_ids) OR assigned_to = distributor_id OR EXISTS (inverters.user_id IN (...)) OR EXISTS (watchers)`
  - Nếu không có: `created_by = distributor_id OR assigned_to = distributor_id OR EXISTS (inverters.user_id = distributor_id) OR EXISTS (watchers)`
- Xem tickets của họ và end users được liên kết

#### DEALER, WAREHOUSE
- **Filter**: `AND 1=0` (không xem được tickets)

### 4.2. Inverters Filtering

#### ADMIN, DEV, SERVICE_CENTER, TECHNICIAN, DEALER, WAREHOUSE
- **Không bị filter**: Xem tất cả inverters

#### END_USER
- **Filter**: `user_id = user.id`
- Chỉ xem inverters của họ

#### DISTRIBUTOR
- **Filter**: 
  - Nếu có linked end users: `user_id IN (distributor_id, ...end_user_ids)`
  - Nếu không có: `user_id = distributor_id`
- Xem inverters của họ và end users được liên kết

### 4.3. Customers Filtering

- **Không có filter theo role**: Tất cả roles có quyền `VIEW_CUSTOMERS` đều xem được tất cả customers

## 5. Internal Comments Rules

### Ai có thể xem Internal Comments?
- ✅ **ADMIN**
- ✅ **DEV**
- ✅ **TECHNICIAN**

### Ai có thể tạo Internal Comments?
- ✅ **ADMIN**
- ✅ **DEV**
- ✅ **TECHNICIAN**

### Ai KHÔNG thể xem Internal Comments?
- ❌ **END_USER**
- ❌ **DISTRIBUTOR**
- ❌ **DEALER**
- ❌ **WAREHOUSE**
- ❌ **SERVICE_CENTER** (cần kiểm tra lại)

## 6. Ticket Assignment Rules

### Auto-Assignment
- Khi tạo ticket mới, hệ thống tự động phân công technician dựa trên `category`:
  - `warranty` → function: `repair`
  - `technical_support` → function: `technicalSupport`
  - `product_consultation` → function: `sale`
  - `other` → function: `management`
- Chỉ chọn users có role `TECHNICIAN` hoặc `ADMIN` (không chọn `DEV`)
- Chọn user có `user_id` nhỏ nhất nếu có nhiều users cùng function

### Manual Assignment
- **ADMIN, TECHNICIAN**: Có thể phân công ticket
- **SERVICE_CENTER**: Có thể phân công ticket
- **END_USER, DISTRIBUTOR**: Không thể phân công ticket

## 7. Ticket Status Rules

### Các Status hiện tại:
1. **initialized** (Khởi tạo) - Ticket mới được tạo, chưa được phân công
2. **in_progress** (Đang xử lý) - Ticket đang được xử lý
3. **pending** (Chờ xử lý) - Ticket đang chờ xử lý
4. **closed** (Đã đóng) - Ticket đã hoàn thành/đóng

### Status Mapping (Backward Compatibility):
- `assigned` → hiển thị như `in_progress`
- `waiting_parts` → hiển thị như `in_progress`
- `completed` → hiển thị như `closed`
- `new` → hiển thị như `initialized`

## 8. Special Rules

### 8.1. DEV Role
- Có tất cả quyền như ADMIN
- Có thể tạo tasks cho quá khứ (các roles khác không thể)
- Có thể bulk delete tickets
- Có thể edit ticket data trực tiếp

### 8.2. System User Masking
- Users có email `system@growatt.vn` hoặc name chứa "System" sẽ bị mask thông tin
- Customer information (customer_name, customer_email) KHÔNG bị mask

### 8.3. Watchers
- Bất kỳ user nào cũng có thể thêm watchers vào ticket
- Watchers có thể xem ticket họ đang theo dõi
- Comments về việc thêm/xóa watchers là internal comments

## 9. Route Access Rules

### Customer Routes (`/customer/*`)
- Chỉ **END_USER** và **DISTRIBUTOR** có thể truy cập
- Sử dụng `CustomerLayout`

### Management Routes (`/`)
- **ADMIN, DEV, SERVICE_CENTER, TECHNICIAN, WAREHOUSE, DEALER** có thể truy cập
- Sử dụng layout tùy theo role

## 10. Function Field (Chức năng)

Technicians và Admins có thể có `function` field:
- `repair` - Sửa chữa
- `technicalSupport` - Hỗ trợ kỹ thuật
- `sale` - Bán hàng
- `management` - Quản lý

Function được dùng cho auto-assignment của tickets.

---

**Lưu ý**: Các rule này được áp dụng ở cả **backend** (API routes) và **frontend** (UI permissions).

