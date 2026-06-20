# Hướng dẫn Sửa Database

Dự án này sử dụng **SQLite** với `better-sqlite3`. Database file nằm tại: `server/database/SSE.db`

## 📋 Các Cách Sửa Database

### 1. Sử dụng Database Console (Khuyến nghị cho queries đơn giản)

Console tương tác để chạy SQL queries trực tiếp:

```bash
cd server
npm run db:console
```

**Các lệnh đặc biệt:**
- `tables` - Liệt kê tất cả các bảng
- `schema <table_name>` - Xem cấu trúc của một bảng
- `help` - Hiển thị hướng dẫn
- `exit` hoặc `quit` - Thoát

**Ví dụ:**
```
SQL> tables
SQL> schema users
SQL> SELECT * FROM users WHERE role = 'admin'
SQL> UPDATE users SET status = 'active' WHERE id = 1
```

**Chạy query từ command line:**
```bash
npm run db:console -- "SELECT * FROM users"
```

### 2. Sử dụng Migration Scripts (Khuyến nghị cho thay đổi schema)

Migration scripts giúp theo dõi và quản lý các thay đổi schema một cách có hệ thống.

**Các bước:**

1. **Mở file migration:** `server/src/database/migrate.ts`

2. **Thêm migration mới:**
```typescript
const migrations: Migration[] = [
  {
    version: 1,
    name: 'Add phone field to users',
    up: () => {
      db.exec(`
        ALTER TABLE users ADD COLUMN phone TEXT;
      `)
    },
    down: () => {
      // Rollback logic (optional)
    }
  },
  // Migration của bạn ở đây
]
```

3. **Chạy migration:**
```bash
cd server
npm run db:migrate
```

**Lưu ý:** SQLite không hỗ trợ `DROP COLUMN` trực tiếp. Để xóa cột, cần:
- Tạo bảng mới không có cột đó
- Copy dữ liệu
- Xóa bảng cũ
- Đổi tên bảng mới

### 3. Sử dụng DB Browser for SQLite (GUI Tool)

1. **Tải DB Browser for SQLite:** https://sqlitebrowser.org/
2. **Mở database file:** `server/database/SSE.db`
3. **Sửa dữ liệu trực tiếp qua giao diện**

### 4. Sửa trực tiếp trong Code

#### Thêm/Sửa/Xóa dữ liệu trong seed scripts

**File seed cơ bản:** `server/src/database/seed.ts`
```bash
npm run db:seed
```

**File seed đầy đủ:** `server/src/database/seed-full.ts`
```bash
npm run db:seed:full
```

**Seed mock users:** `server/scripts/seed-mock-users.ts`
```bash
npm run db:seed:users
```

#### Sửa trong API routes

Ví dụ trong `server/src/routes/users.ts`:
```typescript
// Update user
app.put('/api/users/:id', authenticateToken, (req, res) => {
  const stmt = db.prepare(`
    UPDATE users 
    SET name = ?, email = ?, role = ?, status = ?
    WHERE id = ?
  `)
  // ...
})
```

## 🔧 Các Thao Tác Thường Dùng

### Xem tất cả users
```sql
SELECT id, name, email, role, status FROM users;
```

### Update user
```sql
UPDATE users 
SET name = 'Tên mới', status = 'active' 
WHERE id = 1;
```

### Thêm cột mới vào bảng
```sql
ALTER TABLE users ADD COLUMN new_field TEXT;
```

### Xóa dữ liệu
```sql
DELETE FROM users WHERE id = 1;
-- HOẶC xóa tất cả
DELETE FROM users;
```

### Reset database (xóa và tạo lại)
```bash
cd server
# Xóa file database
rm database/SSE.db

# Chạy lại server (sẽ tự động tạo database)
npm run dev

# Seed dữ liệu
npm run db:seed:full
```

## 📁 Cấu Trúc Database

Xem schema đầy đủ tại:
- `server/src/database/schema.sql` - SQL schema file
- `server/src/database/db.ts` - Schema được định nghĩa trong code

## ⚠️ Lưu Ý Quan Trọng

1. **Backup database trước khi sửa:**
   ```bash
   cp server/database/SSE.db server/database/SSE.db.backup
   ```

2. **Foreign Keys:** Database đã bật foreign key constraints. Khi xóa dữ liệu, cần xóa các bảng con trước.

3. **Transaction:** Đối với các thao tác quan trọng, nên dùng transaction:
   ```typescript
   const transaction = db.transaction(() => {
     // Các queries
   })
   transaction()
   ```

4. **Đóng database:** Luôn đóng database sau khi sử dụng trong scripts:
   ```typescript
   db.close()
   ```

## 🔍 Debug Database

### Xem thông tin database
```sql
-- Xem tất cả tables
SELECT name FROM sqlite_master WHERE type='table';

-- Xem cấu trúc bảng
PRAGMA table_info(users);

-- Xem foreign keys
PRAGMA foreign_key_list(users);
```

### Kiểm tra integrity
```sql
PRAGMA integrity_check;
```

## 📚 Tài Liệu Tham Khảo

- SQLite Documentation: https://www.sqlite.org/docs.html
- Better-SQLite3: https://github.com/WiseLibs/better-sqlite3

