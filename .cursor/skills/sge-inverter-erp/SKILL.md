---
name: sge-inverter-erp
description: >-
  Guides implementation of SGE's internal web app for solar inverter repair
  workflows: finance, repair vs warranty contract fees, equipment purchase and
  sale contracts, service operations,
  warehouse, and RBAC. Use when
  designing schema, APIs, UI, permissions, or features for the SGE project,
  biến tần năng lượng mặt trời, hợp đồng sửa chữa, kho spare part, phiếu dịch
  vụ, multi-role users, i18n Vietnamese English, inverter warranty after
  repair, warranty spare coverage, internationalization, Next.js, Prisma, or
  PostgreSQL, customer portal read-only contracts warranty service cases,
  responsive UI laptop tablet phone, admin dashboard shell sidebar table badges,
  in-app notifications, staff chat direct and group messages admin read-all,
  personal dashboard deadlines, monthly quarterly finance reports.
---

# SGE — Hệ thống quản lý workflow sửa chữa biến tần

Dự án nội bộ **Công ty SGE**: web app theo dõi toàn bộ quy trình sửa chữa biến tần (inverter) năng lượng mặt trời, **bảo hành sau sửa chữa**, tài chính nội bộ, dịch vụ hiện trường, và kho. Agent phải giữ nhất quán thuật ngữ, entity, luồng trạng thái, và ma trận quyền dưới đây khi viết code, migration, hoặc tài liệu kỹ thuật.

## Stack công nghệ (đã chốt)

- **Runtime / UI:** **Next.js** (ưu tiên **App Router** cho dự án mới). Server Components và Route Handlers / Server Actions cho logic gọi DB; client component khi cần tương tác (form, bảng client-side).
- **ORM & DB:** **Prisma** + **PostgreSQL**. Chuỗi kết nối qua biến môi trường `DATABASE_URL`; migration bằng `prisma migrate`; production chạy `prisma migrate deploy` khi release.
- **Schema:** bảng và quan hệ trong `schema.prisma` phản ánh domain M1–M4 và **chat nội bộ nhân viên**; tên model/field thống nhất với entity trong skill (tiếng Anh, `@@map`/`@map` sang `snake_case` trong DB nếu team chọn convention đó). **Bản nháp bảng & ER:** [database-schema.md](./database-schema.md).
- **Truy vấn nặng / báo cáo:** ưu tiên Prisma; chỗ cần SQL thủ công dùng `$queryRaw` có tham số hóa (tránh nối chuỗi SQL).
- **Deploy mục tiêu:** Linux server (VPS, ví dụ Mắt Bão): Node LTS, `next build` + `next start` (hoặc container), reverse proxy (Nginx), PostgreSQL trên cùng máy hoặc host riêng.
- **Giao diện đa thiết bị:** **một codebase** responsive cho **điện thoại**, **iPad / tablet**, **laptop / màn hình lớn** — dùng **Tailwind CSS** (breakpoints `sm` / `md` / `lg` / `xl`) hoặc grid + `useMediaQuery` của Ant Design / MUI. Chi tiết mục *Giao diện đa thiết bị* ngay bên dưới.

Agent khi tạo code mặc định theo stack trên; không đề xuất thay bằng ORM/DB khác trừ khi user yêu cầu rõ ràng.

## Giao diện đa thiết bị & độ rõ ràng (frontend)

**Mục tiêu:** App nội bộ + **Portal KH** hiển thị **rõ ràng, dễ thao tác** trên **smartphone** (Android / iOS), **iPad** (dọc / ngang), **laptop** và màn desktop; ưu tiên thông tin quan trọng trước, tránh chật và không bắt buộc hover để hiểu chức năng.

**Breakpoints tham chiếu** (Tailwind / tương đương)

| Nhóm thiết bị | Gợi ý min-width | Hành vi layout |
|---------------|-----------------|----------------|
| **Mobile** | &lt; 768px | Một cột; menu **drawer / hamburger**; bảng → cuộn ngang có gợi ý hoặc **thẻ (card)** từng dòng; form một cột, nhãn rõ. |
| **Tablet (iPad)** | 768px – 1023px | Sidebar **thu gọn** hoặc drawer; lưới phiếu sửa 1–2 cột; bảng được phép rộng hơn nhưng vẫn tránh cột quá hẹp. Kiểm tra thêm **Split View / đa nhiệm** trên iPad nếu KH dùng song song app khác. |
| **Laptop / desktop** | ≥ 1024px | Sidebar cố định; lưới thẻ ticket **2 cột** như mockup; bảng đầy đủ cột; tận dụng không gian cho báo cáo và nhập liệu nhanh. |

**Nguyên tắc UX**

- **Chạm (touch):** vùng bấm tối thiểu ~**44×44px**; khoảng cách giữa nút đủ để tránh nhầm (đặc biệt trên điện thoại).
- **Chữ & tương phản:** cỡ chữ cơ bản đọc được trên màn nhỏ; **heading / trạng thái / SLA** phân cấp bằng font-size + weight + màu (badge trạng thái, banner SLA).
- **Không phụ thuộc hover:** mọi hành động chính có nhãn hoặc icon + tooltip chỉ bổ sung (desktop).
- **Chi tiết phiếu (ticket):** trên mobile **xếp chồng** các thẻ (Thông tin phiếu → KH → Thiết bị → …); trên desktop giữ **grid 2 cột** như spec.
- **Bảng dữ liệu (kho, danh sách):** desktop full table; mobile **sticky header + scroll** hoặc **card list** (mã, trạng thái, CTA “Xem”).
- **Safe area:** tôn trọng tai thỏ / home indicator (`env(safe-area-inset-*)`) cho PWA hoặc Safari iOS nếu bật.
- **`viewport`:** meta viewport chuẩn; tránh nội dung cố định vượt ngang màn hình.

**Cấu trúc route Next.js**

- Layout dùng chung **shell** (header + slot menu responsive); **`/portal`** và app nội bộ có thể dùng layout khác nhưng **cùng design tokens** (màu, spacing, typography, radius) để giao diện **thống nhất và professional** trên mọi loại máy.

**Độ rõ ràng (clarity)**

- Tránh nhồi nhét: **khoảng trắng**, nhóm field có **tiêu đề section** (i18n); lỗi form hiển thị **gần ô** tương ứng.
- Trạng thái tải / lỗi mạng: **skeleton** hoặc spinner + thông báo ngắn (i18n).
- Tuỳ chọn: tôn trọng **`prefers-reduced-motion`** cho animation nhẹ.

**Kiểm thử**

- Kiểm tra tối thiểu: **375px** (phone), **768px** (iPad dọc), **1024px** (laptop); xoay ngang tablet nếu có màn hình quan trọng.

## Dashboard admin — shell & component (tham chiếu UI)

App **nội bộ SGE** (không phải Portal KH) dùng **layout dashboard hiện đại** giống mockup **điều phối / quản trị** (sidebar + header + vùng nội dung trong **card** trắng, bảng dữ liệu rõ cột, **badge** màu pastel). Tham chiếu trực quan: ảnh mockup team cung cấp (vd. lưu dưới `assets/` trong repo hoặc Figma).

### Bố cục 3 vùng (desktop)

| Vùng | Hành vi | Gợi ý component (Ant Design / MUI / tương đương) |
|------|---------|--------------------------------------------------|
| **Sidebar trái** | Cố định (hoặc thu gọn); **logo SGE** + menu nhóm (**HỆ THỐNG**, **QUẢN LÝ**, …). Mục đang chọn: nền xanh nhạt, icon + chữ **primary**. Mục có con: **chevron** + SubMenu / collapse. | `Layout.Sider` + `Menu`; hoặc `Drawer` trên mobile thay sidebar. |
| **Header trên** | Thanh ngang: **ô tìm kiếm** (icon kính lúp, gợi ý phím tắt **⌘K** / Ctrl+K mở command palette), bên phải **chuyển ngôn VN \| EN** (Segmented / Toggle), **dark mode** (icon trăng), **chuông thông báo** + **Badge** số, **avatar** + tên + menu dropdown. | `Input.Search`, `Segmented`, `Switch`/`Button` theme, `Badge` + `Dropdown`, `Avatar`. |
| **Main** | Nền xám rất nhạt toàn trang; **khối nội dung** là **Card** / container trắng, viền xám nhạt, bo góc nhẹ, **padding rộng**. Trong đó: tiêu đề trang, (tuỳ) thanh filter, **bảng** chính. | `Layout.Content`, `Card`, `Table`. |

### Bảng dữ liệu (danh sách nhân sự, phiếu, kho, …)

- **Header cột:** chữ IN HOA hoặc small caps rõ ràng; sort icon tuỳ cột.
- **Cột “người”:** **Avatar** chữ cái đầu + **tên đậm** + **email** cỡ nhỏ màu secondary (một cell hoặc stack).
- **Cột vai trò / trạng thái:** **Tag / Badge dạng viên thuốc (pill)** — màu **pastel** phân biệt nghĩa (vd. tím quản lý, xanh hỗ trợ, cam sửa chữa, xanh lá sale; trạng thái “Sẵn sàng” xanh). Dùng **map** `role`/`status` → màu trong một file constants để đồng nhất.
- **Cột số / text ngắn:** căn phù hợp (số có thể phải).
- **Cột hành động:** link hoặc `Button` type **link** màu primary (“Chi tiết”, “Lịch”, …).

### Visual tokens (đồng bộ toàn app)

- **Nền:** trắng + xám nhạt (`gray-50` / tương đương); **viền** tinh tế; **bóng** rất nhẹ hoặc không bóng (flat, professional).
- **Primary:** xanh dương cho link, active menu, CTA phụ; **semantic** qua pastel (success/warning/error) cho badge.
- **Typography:** sans-serif hệ thống hoặc Inter / similar; hierarchy: title page, table header, body, muted secondary.
- **Spacing:** thoáng (không nhồi); hàng bảng chiều cao đủ đọc.

### Thư viện UI gợi ý (component “đẹp” sẵn)

- **Ant Design 5** + **Ant Design Pro Components** (ProTable, ProLayout) — gần với mockup kiểu admin B2B; i18n locale `vi_VN` / `en_US`.
- Hoặc **MUI** + **MUI X Data Grid** + tự dựng sidebar.
- Hoặc **shadcn/ui** + **Tailwind** + **TanStack Table** — cần dựng thêm shell sidebar/header nhưng kiểm soát pixel-perfect tốt.

Agent ưu tiên **tái sử dụng** component thư viện (Table, Tag, Avatar, Badge, Layout) thay vì tự vẽ từ đầu; **Portal KH** dùng **cùng tokens** nhưng **sidebar đơn giản** (ít mục), bảng rút gọn.

### Checklist UI dashboard

- [ ] Có **layout shell** dùng lại cho mọi module M1–M4 và **Chat** (hoặc nhúng Chat trong shell).  
- [ ] **Command search** (⌘K) có thể mở trang / phiếu / KH (triển khai theo phase).  
- [ ] **VN/EN** + **dark mode** gắn preference (cookie / localStorage + `next-themes` tuỳ chọn).  
- [ ] Bảng danh sách phiếu sửa / kho / nhân sự dùng **badge** + **avatar** pattern như trên.

## Thông báo & Dashboard cá nhân (“Việc của tôi”)

### Thông báo (in-app)

Khi **phát sinh sự kiện** liên quan đến phiếu / hợp đồng / task, hệ thống tạo **thông báo** cho các user **được coi là liên quan** (không chỉ người trực tiếp thao tác):

| Sự kiện (ví dụ) | Người nhận gợi ý |
|-----------------|------------------|
| Tạo / gán / đổi **người phụ trách** phiếu sửa | `assignee_user_id` mới & cũ (tuỳ policy), **`service_case_followers`**, có thể thêm quản lý khu vực (phase sau). |
| Đổi **trạng thái** phiếu, comment **public** mới | Followers + assignee. |
| **SLA** sắp hết / vượt hạn | Assignee + followers. |
| Giao **task** / đổi deadline task | `assignee_user_id` của task. |
| **Hợp đồng** ký / cần hành động / đến hạn milestone (nếu có) | **`contracts.owner_user_id`** (người phụ trách HĐ — xem schema). |
| Phiếu **gắn HĐ** mở mới | Owner HĐ + assignee phiếu. |
| **Tin nhắn chat** mới trong cuộc user tham gia (tuỳ cấu hình: mọi tin hoặc chỉ @mention) | Thành viên cuộc trò chuyện (trừ người gửi); có thể gộp **badge** với mục Chat trên sidebar. |

- **Kênh:** ưu tiên **in-app** (bảng `notifications` + **badge** trên icon chuông header). **Email / push** có thể bổ sung sau (queue/worker).
- Nội dung: `title` / `body` hoặc **khóa i18n** + `metadata` (tham số); link mở đúng `entity_type` + `entity_id` (phiếu, HĐ, task).
- User đánh dấu **đã đọc** (`read_at`); API đếm **chưa đọc** cho badge.

### Trang Dashboard cá nhân

Route gợi ý: **`/`** hoặc **`/dashboard`** — sau đăng nhập staff mặc định vào **“Việc của tôi”**, không phải danh sách trống.

**Các khối (widget / bảng rút gọn):**

1. **Phiếu sửa cần xử lý** — `service_cases` mà user là **`assignee_user_id`** **hoặc** có trong **`service_case_followers`**, `status` ∉ {`closed`, `cancelled`}. Sắp xếp: **hết hạn SLA trước** (`sla_response_due_at` ASC, NULL sau), rồi `updated_at`. Hiển thị badge **quá hạn** / **hôm nay** / **sắp tới**.
2. **Task có hạn** — `tasks` với `assignee_user_id` = user, `status` chưa hoàn thành, **`due_at`** không null. Sắp xếp `due_at` ASC; cảnh báo **overdue** đỏ / **due today** cam.
3. **Hợp đồng cần thực hiện** — `contracts` có **`owner_user_id`** = user (hoặc quy tắc SGE mở rộng), `status` ∈ {`signed`, `in_progress`, …} và (tuỳ nghiệp vụ) còn việc: chưa đủ thu, chưa gắn phiếu, v.v. Hiển thị **deadline** nếu có cột **`due_at` / `expected_close_date`** trên HĐ (bổ sung schema nếu cần).

**UI:** dùng **card** hoặc **bảng gọn** cùng design token dashboard; mỗi dòng có CTA “Mở”. **Portal KH** không dùng dashboard nội bộ này (chỉ xem dữ liệu của họ theo mục Portal).

---

## Nguyên tắc chung

- **Định danh kỹ thuật** (bảng, API, code): tiếng Anh, `snake_case` hoặc convention đã chọn trong repo; **nhãn UI** lấy từ **i18n** (internationalization), không hardcode chuỗi hiển thị trong component.
- **Đa ngôn ngữ (i18n):** hỗ trợ chuyển **Tiếng Việt** và **English** (locale `vi`, `en` hoặc tương đương). Mọi copy UI (tiêu đề, nút, thông báo lỗi, validation) dùng **khóa dịch** ổn định; bản dịch nằm trong file/message catalog theo locale. Ngày/số/tiền tệ format theo locale; API và schema giữ nguyên tiếng Anh.
- **Module 2 (dịch vụ)** là trung tâm liên kết: phiếu sửa và task **tham chiếu** tới khách/hợp đồng (M1) và tới xuất/nhập kho (M3).
- **Kho**: mọi thay đổi tồn spare part đi qua **ledger** (`stock_movement` / dòng chi tiết), không chỉ cập nhật một trường tồn tĩnh. **Khi có bảo hành sau sửa** (`repair_warranty`): (1) phiếu xuất/nhập linh kiện phục vụ sửa **trong thời hạn BH** phải **gắn** `repair_warranty_id` (hoặc tương đương) để phân biệt hạch toán / miễn phí KH; (2) **bổ sung phạm vi spare** trên bản ghi BH — danh sách linh kiện hoặc nhóm part được cover (bảng `repair_warranty_covered_part` hoặc quy ước policy), không để BH “trống” về linh kiện khi nghiệp vụ yêu cầu khai báo.
- **Đa vai trò**: một `user` có nhiều `role`; quyền hiệu lực = **hợp (union)** của tất cả role được gán.
- **Audit**: thao tác nhạy cảm (quyền, số tiền, điều chỉnh tồn) nên có lịch sử hoặc log; agent đề xuất bảng/field phù hợp stack hiện tại.
- **Bảo hành sau sửa chữa:** mỗi lần hoàn tất sửa chữa (bàn giao), biến tần có thể có **kỳ bảo hành theo phiếu** (thời hạn, phạm vi). Lưu lịch sử theo từng `service_case` / `device`; phiếu mới trong hạn có thể **liên kết bảo hành cũ** hoặc gia hạn theo policy SGE.
- **Portal khách hàng:** tách **ứng dụng / route group** (hoặc subdomain) cho KH đăng nhập; **chỉ đọc** dữ liệu thuộc **`customer_id`** của họ. **Không** trả `service_case_activities` / API timeline có `is_internal = true`; **không** hiển thị task nội bộ, kho, giá chi tiết, comment nội bộ — xem mục *Portal khách hàng*.
- **Chat nội bộ:** chỉ **nhân viên** (staff); **không** dùng chung luồng với Portal KH. Chi tiết mục *Chat nội bộ nhân viên*.

---

## Module 1 — Tài chính nội bộ

**Phạm vi:** khách hàng, hợp đồng/báo giá, thu, chi, công nợ và báo cáo kỳ.

| Khối | Entity gợi ý | Ghi chú |
|------|----------------|--------|
| Khách & site | `customer`, `contact`, `site` | Site = địa điểm lắp đặt / sửa chữa nếu cần tách |
| Hợp đồng | `contract`, `quote`, `contract_line` | Trạng thái: draft → signed → in_progress → closed / cancelled. **`contract_kind`** phân loại HĐ: **dịch vụ sửa chữa** (một máy, hai loại phí) **hoặc** **mua bán thiết bị** — **mua vào** (SGE mua từ NCC) / **bán ra** (SGE bán cho KH). Chi tiết mục *Loại hợp đồng & dòng HĐ* bên dưới. **`owner_user_id`** (người phụ trách HĐ) để **Dashboard** và **thông báo** HĐ. |
| Thu | `payment_in`, `invoice` (nếu dùng) | Liên kết `contract` hoặc milestone; tuỳ chọn gắn **dòng phí** (sửa vs bảo hành) để đối soát. |
| Chi | `expense`, `cost_allocation` | Phân loại: linh kiện (mua), công tác, nhân công, khác; có thể tham chiếu `service_case`, `business_trip`, `stock_movement` |
| Báo cáo tài chính | (tổng hợp từ `payment_in`, `expense`, `contracts`…) | **Theo tháng** và **theo quý** — chi tiết ngay dưới |

**Ràng buộc nghiệp vụ (khung):** không xóa cứng khách đã có hợ đồng; chỉnh số tiền quan trọng nên có audit. Bản ghi bảo hành sau sửa (`repair_warranty`) nên **liên kết** dòng HĐ loại **phí bảo hành** (`contract_line_id`) khi có — **chỉ** với HĐ **`contract_kind = repair_service`**.

### Loại hợp đồng & dòng HĐ (dịch vụ sửa chữa vs mua bán thiết bị)

**`contracts.contract_kind`** (enum gợi ý, nhãn UI qua i18n):

| Giá trị kỹ thuật | Nghiệp vụ | Đối tượng / đối tác | Dòng HĐ (`contract_line`) |
|------------------|-----------|---------------------|---------------------------|
| **`repair_service`** | Hợp đồng **sửa chữa** (một máy) | `customer_id` (KH); optional `device_id` | Bắt buộc **`line_fee_kind`**: `repair` \| `warranty` — như spec hiện tại; `repair_warranty` liên kết dòng `warranty`. |
| **`equipment_purchase`** | **Mua vào** thiết bị (SGE mua từ NCC) | **`supplier_id`** (FK `suppliers`); `customer_id` thường NULL | Mỗi dòng = **hàng mua**: tham chiếu **`part_id`** (SKU `part_kind` thường là `inverter` / `board` tùy danh mục), `quantity`, `unit_price`, `line_total`; **`line_fee_kind`** không dùng (NULL + validate ứng dụng). |
| **`equipment_sale`** | **Bán ra** thiết bị (SGE bán cho KH) | `customer_id`; optional `site_id` | Mỗi dòng = **hàng bán**: `part_id`, `quantity`, đơn giá; optional **serial** từng dòng nếu bán máy có SN (`serial_number` trên dòng hoặc gắn `equipment_id` / `device_id` sau giao). **`line_fee_kind`** không dùng cho loại này. |

**Liên kết kho (M3):**

- **Mua vào:** khi nhận hàng / ghi sổ nhập, phiếu **`stock_movements`** (nhập) có thể gắn **`contract_id`** (và `reason` = mua theo HĐ) để đối soát PO/HĐ mua — công nợ với NCC theo HĐ + chứng từ chi (vd. **`expense`** hoặc bảng **`payment_out`** nếu team bổ sung sau).
- **Bán ra:** khi xuất giao máy, phiếu **xuất kho** gắn **`contract_id`** + `reason` = bán theo HĐ; thu tiền qua **`payment_in`** gắn `contract_id` (và có thể `contract_line_id` từng dòng hàng).

**Báo cáo tài chính:** có thể tách **doanh thu bán thiết bị** vs **thu phí dịch vụ** bằng cách lọc `payment_in` theo `contracts.contract_kind` (và/hoặc join dòng HĐ có `part_id`). Team chốt có hiển thị cột “theo loại HĐ” trên báo cáo tháng/quý hay không.

**Quyền / UI:** danh sách HĐ nên filter theo **`contract_kind`**; form tạo HĐ chọn loại trước khi nhập dòng (tránh nhầm dòng phí sửa với dòng hàng). Portal KH: xem được HĐ **`equipment_sale`** thuộc KH (read-only), không cần thấy HĐ **mua vào** nội bộ.

### Báo cáo & thống kê tài chính (theo tháng / theo quý)

**Mục tiêu:** Màn hình và API **báo cáo — thống kê tài chính** cho kế toán / lãnh đạo: so sánh **thu**, **chi**, và các chỉ số **công nợ / backlog** (tuỳ định nghĩa SGE) trong **từng tháng dương lịch** và **từng quý** (Q1–Q4). Nhãn và format số qua **i18n**.

**Kỳ thời gian**

| Chế độ | Tham số | Ghi chú |
|--------|---------|--------|
| **Theo tháng** | `year`, `month` (1–12) | Gom theo **tháng dương lịch**; mốc: `payment_in.paid_at`, `expense.spent_at` (hoặc `posted_at` nếu có). |
| **Theo quý** | `year`, `quarter` (1–4) | Q1–Q4 theo lịch; UI có thể vẽ **biểu đồ** bốn quý trong năm. |

**Múi giờ:** bucket báo cáo theo **Asia/Ho_Chi_Minh** (hoặc config tập trung) để khớp chứng từ thực tế.

**Chỉ số gợi ý**

- **Tổng thu kỳ:** `SUM(payment_in.amount)`; nhóm theo **`contracts.contract_kind`** (dịch vụ vs **bán thiết bị**); với HĐ sửa chữa, nhóm thêm theo **`contract_line.line_fee_kind`** nếu `payment_in.contract_line_id` được ghi đầy đủ (**phí sửa** vs **phí bảo hành**).  
- **Tổng chi kỳ:** `SUM(expense.amount)`; nhóm theo `expense.category`.  
- **Thu − chi (gộp):** chỉ hiển thị khi SGE chấp nhận định nghĩa; ghi chú disclaimer trên UI.  
- **Công nợ:** công thức từ HĐ + dòng phí so với đã thu — team chốt; có thể báo **tại ngày cuối tháng / cuối quý**.

**Quyền:** `finance.report:read`; role **`accounting`**, **`admin`**. **Portal KH** không xem báo cáo toàn công ty.

**API gợi ý:** `GET .../reports/finance/summary?granularity=month&year=&month=` hoặc `granularity=quarter&quarter=` — trả JSON cho bảng + chart.

**Triển khai:** query tại thời điểm gọi (Prisma aggregate / SQL tham số); **materialized view** hoặc job đêm chỉ khi cần tối ưu volume.

---

## Module 2 — Quản lý dịch vụ

**Phạm vi:** phiếu sửa biến tần, task, công tác, (tuỳ chọn) lịch hiện trường.

| Entity gợi ý | Mô tả ngắn |
|--------------|------------|
| `service_case` | Phiếu/ticket theo khách, site, thiết bị — UI chi tiết dạng **ticket** (header, thẻ thông tin, SLA, nhật ký, comment nội bộ); xem mục *Màn hình chi tiết phiếu sửa* |
| `device` | Biến tần: **SN** (`serial_number`), **hãng sản xuất** (`manufacturer`), model |
| `task` | Giao việc: assignee, **`due_at`** (hiển thị trên Dashboard + thông báo sắp hạn), liên kết `service_case` |
| `notification` | Thông báo in-app: user nhận, loại sự kiện, link entity; **đã đọc** / chưa đọc |
| `business_trip` | Đăng ký chuyến, phê duyệt, chi phí dự kiến/thực tế → `trip_expense` |
| `repair_warranty` | Bản ghi bảo hành **sau sửa chữa** cho một `device` (và/hoặc serial), gắn **bắt buộc** với `service_case` đã hoàn thành |
| `repair_warranty_covered_part` | **Bổ sung spare khi có BH:** từng `part_id` (hoặc ghi chú nhóm) nằm trong phạm vi đổi/thay **miễn phí / theo gói** trong thời hạn `repair_warranty` |

**Bảo hành sửa chữa (`repair_warranty`) — khung dữ liệu:**

- **Bắt đầu:** ngày hiệu lực (thường = ngày `delivered` hoặc `closed` — chốt một quy tắc SGE và giữ nhất quán).
- **Kết thúc:** `warranty_end_date` hoặc `warranty_duration_months` + tính toán; hỗ trợ cảnh báo **sắp hết hạn** / **đã hết hạn** (query/UI).
- **Nội dung:** loại bảo hành (ví dụ: linh kiện thay, công lao động), điều kiện loại trừ (tuỳ policy), ghi chú; có thể tham chiếu `contract_line` (M1) nếu hợp đồng quy định thời hạn chuẩn. **Spare:** khai báo **`repair_warranty_covered_part`** (danh sách part trong phạm vi BH) khi nghiệp vụ SGE yêu cầu — đối chiếu với xuất kho có `repair_warranty_id`.
- **Lịch sử:** mỗi lần sửa lại tạo `service_case` mới; có thể chuỗi `repair_warranty` theo thời gian cho cùng `device` (không ghi đè im lặng — ưu tiên append hoặc version).

**Trạng thái phiếu sửa (state machine):**

```
received → diagnosing → waiting_parts → in_repair → testing → delivered → closed
```

Các nhánh hủy: `cancelled` từ `diagnosing` hoặc `waiting_parts` (hoặc theo policy SGE — ghi rõ trong code comment nếu mở rộng).

**Liên kết:** `waiting_parts` / `in_repair` ↔ yêu cầu hoặc phiếu xuất kho (M3); chi phí công tác ↔ M1. Khi chuyển sang `delivered`/`closed`, luồng UI/API có thể **tạo hoặc xác nhận** `repair_warranty` (nếu áp dụng cho phiếu đó).

### Màn hình chi tiết phiếu sửa (layout tham chiếu — ticket-style)

Màn **chi tiết một phiếu** (`service_case`) bố cục theo dạng **ticket** (như mockup nội bộ SGE): header + lưới thẻ thông tin + khu vực mô tả/đính kèm + nhật ký & comment. Toàn bộ nhãn UI qua **i18n** (`vi` / `en`).

**1. Header**

- **Mã phiếu** (`case_code`, vd. `TKT-2025-291133`) + dòng phụ: tên KH ngắn + **loại phiếu** (`case_kind`: `repair` \| `warranty` — tương ứng “Sửa chữa” / “Bảo hành” trên UI).
- Nút **Đóng phiếu** (chuyển `status` → `closed` hoặc luồng đóng có kiểm tra).
- **Cảnh báo SLA** (banner): hiển thị khi vượt hạn phản hồi / xử lý — dữ liệu từ field SLA trên phiếu (xem schema).

**2. Lưới thẻ (grid), mỗi thẻ có nút Sửa / Thay đổi tùy quyền**

| Thẻ | Nội dung hiển thị (map entity) |
|-----|--------------------------------|
| **Thông tin phiếu** | Mã, **trạng thái** (`status`), **loại** (repair/warranty), **độ ưu tiên** (`priority`), ngày tạo, cập nhật lần cuối. |
| **Khách hàng** | Từ `customer`: tên, SĐT, email (có thể chỉnh nhanh hoặc link sang hồ sơ KH). |
| **Thiết bị** | Từ `device`: model, **SN**; **loại sự cố** có thể hiển thị từ `service_case.incident_category` và/hoặc `case_kind`; **hết hạn BH** + **trạng thái BH** (badge — từ BH hãng trên `device` hoặc `repair_warranty` đang hiệu lực). |
| **Người phụ trách** | `assignee_user_id` + chức năng/vai trò hiển thị (text hoặc từ user profile). |
| **Người theo dõi** | Danh sách user theo dõi phiếu (`service_case_follower`); nút thêm follower. |
| **SLA** | Thời gian phản hồi mục tiêu (vd. 4h), **hạn phản hồi**, thời gian xử lý onsite gợi ý (vd. 24–48h) — lưu trên phiếu hoặc template theo loại phiếu. |

**3. Khu vực full width**

- **Mô tả sự cố** — `incident_description` (text/markdown tùy stack).
- **File đính kèm** — ảnh/tài liệu (`service_case_attachment` hoặc storage + bảng metadata).

**4. Hai cột dưới (hoặc stack trên mobile)**

- **Nhật ký hoạt động** — timeline: tạo phiếu, đổi trạng thái, gán người, xuất kho… (`service_case_activity` hoặc tái sử dụng `audit_logs` có `entity_type = service_case`). Ô nhập **comment công khai** + **nút đổi trạng thái nhanh** (map sang `status`: vd. “Đã nhận máy” → `received`, “Đang kiểm tra sửa” → `in_repair`, “Cần xác nhận thông tin” → `diagnosing` hoặc state riêng — **chốt bảng map** trong code constants + i18n).
- **Comment nội bộ** — chỉ role được quyền; lưu riêng (`is_internal = true` trên activity/comment).

**5. Bổ sung bắt buộc so với mockup cơ bản (domain SGE)**

- Thẻ / section **Linh kiện & phiếu kho**: danh sách xuất/nhập gắn `service_case_id` (`stock_movement` / `movement_line`): mã part, `part_kind`, số lượng, ngày NX, cờ **trong phạm vi BH** (`repair_warranty_id` nếu có).
- Thẻ / section **Hợp đồng & phí** (nếu phiếu gắn `contract_id` và HĐ **`repair_service`**): tóm tắt **phí sửa chữa** vs **phí bảo hành** (`line_fee_kind`), công nợ từng loại (đọc từ M1). Nếu HĐ là **bán thiết bị**, hiển thị tóm tắt hàng/đơn giá theo policy (không nhầm với phí sửa).
- Section **Spare theo gói BH** (khi `case_kind = warranty` hoặc khi có `repair_warranty` / `repair_warranty_covered_part`): danh sách part được cover và đối chiếu với xuất kho.

Agent khi implement UI **ưu tiên** cấu trúc trên; map trạng thái nút nhanh ↔ `status` trong một bảng constants duy nhất để tránh lệch UX và backend.

---

## Module 3 — Quản lý kho

**Phạm vi:** spare part, nhập xuất linh kiện, máy (asset) nhập/xuất.

| Entity gợi ý | Ghi chú |
|--------------|--------|
| `part`, `supplier` | Danh mục: **`part_kind`** = `component` (linh kiện — có **ngày nhập** + **người nhập** trên phiếu nhập), `board` (sửa/lắp **từ linh kiện**), `inverter` (sửa/lắp **từ board**). Quan hệ cấu thành bảng `part_structure` (parent/child). **Mã part** `part_code`; NX kho qua `stock_movement` |
| `warehouse`, `stock_balance` | Tồn theo kho/vị trí nếu đa kho |
| `stock_movement`, `movement_line` | Mọi NX; `reason` + `service_case_id` khi xuất cho sửa; **`contract_id`** khi nhập/xuất theo HĐ **mua vào / bán ra** thiết bị; **trong thời hạn BH** thêm `repair_warranty_id`. Phạm vi spare của gói BH khai báo **`repair_warranty_covered_part`** (bổ sung khi lập BH) |
| `equipment`, `equipment_movement` | Máy khách / nội bộ: bảo hành, trả máy |

**Nguyên tắc:** cấm hoặc kiểm soát **tồn âm** theo policy; xuất có thể **reserve** (giữ) trước khi xuất thực nếu nghiệp vụ cần.

---

## Module 4 — Người dùng & phân quyền (RBAC)

**Vai trò chuẩn SGE:**

| Role code | Quyền khung (module) |
|-----------|----------------------|
| `dev` | Toàn quyền kỹ thuật: đọc/ghi/cấu hình trên M1–M3 + quản trị user/role. **Chat:** thường gán **`chat.conversation:read_all`** để hỗ trợ debug (chỉ dùng cho tài khoản kỹ thuật sản phẩm; ưu tiên giới hạn production). |
| `admin` | Truy cập **cả ba** module nghiệp vụ (M1, M2, M3) theo policy công ty; không tự động đồng nghĩa bypass mọi quy tắc phê duyệt trừ khi spec ghi rõ. **Chat:** có quyền **`chat.conversation:read_all`** — **xem mọi cuộc trò chuyện** (kể cả không tham gia), kèm UI giám sát / audit theo policy SGE. |
| `accounting` | Trọng tâm **M1** + **báo cáo tài chính** tháng/quý (`finance.report:read`); M2/M3: **read** tối thiểu nếu cần đối soát (phiếu sửa, xuất kho). |
| `warehouse` | Trọng tâm **M3**; có thể **read** M2 để liên kết phiếu xuất với `service_case`. |
| `technician` | Trọng tâm **M2**; M3: tạo yêu cầu / xuất theo quy trình (không sửa giá mua); M1: thường không hoặc read. |
| `customer_portal` | **Chỉ cổng KH:** đọc hợp đồng / bảo hành / phiếu sửa **của đúng `customer_id`**; không module M3; không sửa dữ liệu nội bộ (tuỳ chọn sau: tạo ticket yêu cầu — ngoài phạm vi “chỉ xem”). **Không** chat nội bộ. |
| `accounting`, `warehouse`, `technician` | **Chat:** thường gán **`chat.conversation:read`**, **`chat.message:write`**, và (tuỳ policy) **`chat.group:create`**; **không** **`chat.conversation:read_all`**. |

**Mô hình dữ liệu:** `users` ↔ `user_roles` ↔ `roles` ↔ `role_permissions` ↔ `permissions`. Permission nên dạng `resource:action` (ví dụ `finance.contract:read`, **`finance.report:read`**, `service.case:write`, `warehouse.movement:approve`, và **chat** — xem dưới).

**Quyền chat (gợi ý)**

| Permission | Ý nghĩa |
|------------|---------|
| **`chat.conversation:read`** | Xem danh sách & nội dung các **cuộc mình là thành viên** (1-1 hoặc nhóm). |
| **`chat.message:write`** | Gửi tin trong các cuộc được phép (thường đi kèm `read`). |
| **`chat.group:create`** | Tạo **nhóm chat**, đặt tên, mời thành viên ban đầu (tuỳ policy ai được tạo nhóm). |
| **`chat.group:manage`** | (Tuỳ chọn) Thêm / xóa thành viên, đổi tên nhóm — chủ yếu **chủ nhóm** (`group` role trên bảng member) hoặc admin nghiệp vụ. |
| **`chat.conversation:read_all`** | **Giám sát:** đọc **mọi cuộc** trong hệ thống, **không cần** là thành viên. Gán cho role **`admin`** (và có thể **`dev`**); **bắt buộc** ghi **audit log** khi mở/xem cuộc qua quyền này nếu SGE yêu cầu tuân thủ / minh bạch. |

**Kiểm tra:** middleware/guard chung; UI ẩn menu module khi không có quyền `read` tương ứng. User cổng KH có **`customer_id`** (hoặc bảng nối `customer_user`) — mọi query **bắt buộc** lọc theo customer đó (chống IDOR).

**API chat — scope truy vấn**

- User thường: `WHERE conversation_id IN (SELECT … FROM chat_conversation_members WHERE user_id = :me AND left_at IS NULL)`.
- User có **`chat.conversation:read_all`**: được list **tất cả** `chat_conversations` + đọc `chat_messages` không cần membership; response có thể gắn cờ `viewed_as_supervisor: true` để client hiển thị banner “Chế độ quản trị”.

---

## Chat nội bộ nhân viên

**Phạm vi:** trao đổi nhanh giữa **nhân viên đăng nhập app nội bộ**; **không** triển khai trên **Portal KH** (KH không thấy chat, không có endpoint chung không kiểm soát).

**Loại cuộc trò chuyện**

| Loại | Mô tả | Dữ liệu gợi ý |
|------|--------|----------------|
| **1-1 (direct)** | Hai user | `conversation_type = direct`; đúng **hai** thành viên đang hoạt động (`left_at` NULL). Tránh trùng cặp: unique `(user_a, user_b)` ứng dụng hoặc bảng tra cứu. |
| **Nhóm (group)** | Nhiều user, có **tên nhóm** | `conversation_type = group`; `title`; **`created_by_user_id`**; thành viên qua `chat_conversation_members`; **chủ nhóm** có thể mời/loại (permission `chat.group:manage` hoặc role `owner` trên member). |

**UI / UX**

- Sidebar hoặc mục **“Tin nhắn / Chat”**: danh sách cuộc, preview tin cuối, badge chưa đọc.
- Màn hình chi tiết: luồng tin, ô nhập, gửi; mobile: layout một cột, **sticky** ô nhập (tránh che bởi bàn phím nếu có thể).
- **Admin / giám sát:** mục riêng **“Tất cả cuộc trò chuyện”** (chỉ khi có **`chat.conversation:read_all`**): bảng lọc theo loại, thành viên, thời gian; vào xem nội dung như “read-only supervisor” trừ khi spec mở rộng (vd. xóa vi phạm).

**Realtime (gợi ý kỹ thuật)**

- **WebSocket** (hoặc SSE) channel theo `conversation_id`, xác thực session; fallback **polling** ngắn nếu cần MVP.
- Server **luôn** kiểm tra quyền trước khi subscribe hoặc trả lịch sử tin.

**Thông báo:** tin mới → `notifications` với `notification_type = chat_message` (hoặc tương đương) + `entity_type`/`entity_id` trỏ tới `conversation_id` / `message_id` — xem bảng sự kiện ở mục *Thông báo*.

**Audit:** mỗi lần user có **`read_all`** mở thread hoặc export — ghi `audit_logs` (`action` = `chat_supervisor_view`, `entity_id` = `conversation_id`) nếu policy SGE yêu cầu.

Chi tiết bảng: [database-schema.md](./database-schema.md) (mục Chat nội bộ).

---

## Portal khách hàng (Customer portal)

**Mục tiêu:** KH đăng nhập xem **tình trạng hợp đồng**, **bảo hành**, **phiếu sửa chữa**; trên phiếu sửa chỉ thấy **nhật ký / comment công khai** (tương đương `service_case_activities` với **`is_internal = false`**). **Không** có **chat nội bộ nhân viên** trên portal.

**Phạm vi hiển thị (đề xuất)**

| Khu vực | Được xem | Không xem / ẩn |
|---------|-----------|----------------|
| **Hợp đồng** | Hợp đồng có `customer_id` khớp user: mã, **`contract_kind`**, trạng thái, thiết bị/site liên quan (nếu có). Với **`repair_service`:** **tóm tắt** phí sửa vs phí BH. Với **`equipment_sale`:** tóm tắt **hàng bán** (model/SKU, SL — tùy policy hiển thị). | HĐ **`equipment_purchase`** (mua vào NCC), ghi chú nội bộ, giá vốn chi tiết nếu SGE ẩn với KH. |
| **Bảo hành** | `repair_warranty` (và/hoặc BH hãng trên thiết bị) thuộc thiết bị / phiếu của KH: thời hạn, trạng thái còn hạn, mô tả gói **đã được phép công khai**. | `repair_warranty_covered_part` chi tiết giá, nội dung nội bộ. |
| **Phiếu sửa** | `service_case` của KH: mã phiếu, loại (sửa/BH), trạng thái, thiết bị, SLA **hiển thị cho KH** (nếu có), mô tả sự cố **đã được phép công khai**, file đính kèm **đánh dấu public** (tuỳ chọn thêm `is_visible_to_customer` trên attachment). | Task, người theo dõi nội bộ, xuất kho, comment nội bộ, activity có `is_internal = true`. |

**Comment / timeline**

- API và UI portal: `WHERE is_internal = false` (và chỉ `activity_type` phù hợp — vd. `comment`, `status_change` nếu SGE cho phép KH thấy đổi trạng thái).
- Staff khi gửi cập nhật cho KH dùng **luồng public activity**; thảo luận nội bộ **luôn** `is_internal = true`.

**Kỹ thuật (Next.js)**

- Route riêng: vd. `/portal/...` hoặc subdomain `portal.`; session role `customer_portal` + `customerId` trong JWT/session.
- **Không tái sử dụng** handler nội bộ cho portal mà không qua lớp **policy** (scope theo `customer_id` + filter activity).

---

## Ma trận menu (tham chiếu UI)

- **Trang chủ / Việc của tôi:** Dashboard cá nhân (phiếu sửa, task deadline, HĐ cần xử lý)  
- **Thông báo:** Danh sách + đánh dấu đọc (gắn icon header)  
- **Chat / Tin nhắn:** Cuộc trò chuyện của tôi (1-1 + nhóm); **Admin:** **Tất cả cuộc trò chuyện** (chỉ với `chat.conversation:read_all`)  
- **Users & roles:** Users, Roles, Assignments, (tuỳ) Permission audit log  
- **M1:** Khách hàng, Hợp đồng & báo giá (**lọc theo loại:** sửa chữa / **mua vào** / **bán ra**), Thu, Chi, **Báo cáo tài chính** (tổng hợp **theo tháng** / **theo quý**: thu, chi, phân loại — có thể tách theo **`contract_kind`**)  
- **M2:** Phiếu sửa, Task board, Công tác, Thiết bị/site, **Bảo hành sau sửa** (danh sách / theo thiết bị / sắp hết hạn)  
- **M3:** Linh kiện, Phiếu NX spare, Máy & NX máy, Tồn kho  
- **Portal KH (read-only):** Hợp đồng của tôi, Bảo hành, Phiếu sửa (chi tiết + **chỉ** timeline/comment public)

---

## Checklist trước khi hoàn thành tính năng xuyên module

- [ ] API kiểm tra `permission` + `user_id` (không tin tưởng client); Prisma chỉ gọi từ server (route handlers / server actions), không lộ credentials client.  
- [ ] Portal KH: mọi API lọc `customer_id`; không trả activity/attachment nội bộ; không IDOR giữa các KH.  
- [ ] Thay đổi tồn kho luôn có bản ghi movement.  
- [ ] Sửa trong thời hạn BH: movement linh kiện có `repair_warranty_id`; khi tạo BH có **bổ sung** phạm vi spare (covered parts) nếu policy SGE yêu cầu.  
- [ ] Liên kết rõ: chi phí ↔ nguồn (hợp đồng / phiếu sửa / trip / nhập hàng).  
- [ ] Hợp đồng: **`contract_kind`** đúng nghiệp vụ; HĐ **sửa chữa** có dòng **`line_fee_kind`** `repair` vs `warranty`; HĐ **mua/bán thiết bị** có dòng gắn **`part_id`** + số lượng/đơn giá; thu (`payment_in`) đối soát theo HĐ/dòng; **nhập/xuất kho** gắn `contract_id` khi phát sinh từ HĐ mua/bán.  
- [ ] Trạng thái `service_case` nhất quán với hành động (ví dụ không `delivered` nếu chưa đủ bước nghiệp vụ).  
- [ ] Chuỗi UI qua i18n; đủ bản dịch **vi** và **en**; format ngày/số/tiền theo locale.  
- [ ] Layout responsive: dùng tốt trên **phone / tablet / laptop**; bảng hoặc card list trên mobile; vùng chạm đủ lớn.  
- [ ] Bảo hành sau sửa: có bản ghi `repair_warranty` gắn `service_case` + `device`; **`repair_warranty_covered_part`** khi cần khai báo spare; hiển thị trạng thái còn hạn / hết hạn; không mất lịch sử khi có phiếu sửa tiếp theo.  
- [ ] Sự kiện nghiệp vụ tạo **`notifications`** cho user liên quan; Dashboard cá nhân lọc đúng **assignee / follower / owner HĐ**; deadline (SLA phiếu, `task.due_at`, HĐ) hiển thị và cảnh báo màu.  
- [ ] Báo cáo tài chính: API/UI **theo tháng** và **theo quý**, timezone thống nhất; chỉ role được **`finance.report:read`**; thu có thể tách **`contract_kind`** và (HĐ sửa chữa) **`line_fee_kind`** khi dữ liệu cho phép.  
- [ ] **Chat:** chỉ staff; list/đọc tin theo **membership** trừ khi có **`chat.conversation:read_all`**; mọi API/WebSocket kiểm tra permission; **admin** xem được mọi cuộc theo spec; **audit** khi xem với quyền giám sát nếu policy yêu cầu.

---

## Khi agent không chắc

Ưu tiên hỏi lại product owner / đặt giả định rõ trong comment hoặc ADR ngắn; không tự ý đơn giản hóa RBAC hoặc bỏ ledger kho.
