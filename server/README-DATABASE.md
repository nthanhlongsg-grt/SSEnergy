# Database Schema - SGE After-Sales Management System

## Tổng quan

Database sử dụng SQLite để lưu trữ dữ liệu cho hệ thống quản lý hậu mãi SGE.

## Các bảng chính

### 1. users
Quản lý người dùng hệ thống
- **Các role**: admin, service_center, technician, distributor, dealer, end_user, warehouse
- **Status**: active, inactive, suspended

### 2. customers
Thông tin khách hàng
- **customer_type**: enterprise, residential
- Lưu thông tin liên hệ, địa chỉ, mã số thuế

### 3. distributors
Thông tin đại lý/nhà phân phối
- Quản lý các đại lý phân phối sản phẩm SGE

### 4. inverters
Thông tin thiết bị inverter
- Serial number (unique)
- Model, công suất
- Thông tin bảo hành
- Liên kết với customer và distributor

### 5. tickets
Quản lý ticket bảo hành/sửa chữa
- Ticket number (unique)
- Priority: low, medium, high, urgent
- Status: new, assigned, in_progress, waiting_parts, completed, closed
- SLA tracking

### 6. ticket_comments
Bình luận/cập nhật trên ticket

### 7. service_reports
Biên bản dịch vụ sửa chữa
- Report number (unique)
- Chi tiết dịch vụ, chẩn đoán, hành động
- Chi phí lao động và linh kiện
- Chữ ký khách hàng và kỹ thuật viên

### 8. warehouse_parts
Quản lý linh kiện trong kho
- Part number (unique)
- Số lượng tồn kho
- Giá, nhà cung cấp
- Cảnh báo số lượng tối thiểu

### 9. warehouse_transactions
Lịch sử giao dịch kho
- Nhập/xuất linh kiện
- Theo dõi biến động tồn kho

### 10. rma_requests
Yêu cầu RMA (Return Merchandise Authorization)
- RMA number (unique)
- Lý do trả hàng
- Theo dõi trạng thái xử lý

### 11. technician_schedules
Lịch làm việc kỹ thuật viên
- Lên lịch công việc
- Liên kết với ticket
- Theo dõi trạng thái hoàn thành

### 12. projects
Dự án/công trình lắp đặt
- Thông tin dự án
- Liên kết với customer

### 13. inverter_history
Lịch sử sự kiện của inverter
- Bảo trì, sửa chữa, kiểm tra
- Liên kết với service reports và tickets

### 14. settings
Cài đặt hệ thống
- Các tham số cấu hình
- SLA settings
- Thông tin công ty

## Seed Data

### Chạy seed đầy đủ:
```bash
npm run db:seed:full
```

Seed sẽ tạo:
- 5 users mẫu (admin, service center, technician, distributor, warehouse)
- 4 customers mẫu
- 2 distributors mẫu
- 3 inverters mẫu
- 5 warehouse parts mẫu
- 1 ticket mẫu
- System settings mặc định

### Chạy seed cơ bản (chỉ users):
```bash
npm run db:seed
```

## Database Location

Database file: `server/database/SGE.db`

File này sẽ tự động được tạo khi chạy server lần đầu.

## Backup Database

```bash
# Copy database file
cp server/database/SGE.db server/database/SGE.db.backup
```

## Reset Database

```bash
# Xóa database và tạo lại
rm server/database/SGE.db
npm run db:seed:full
```
