import { amountToVietnameseWords } from './numberToWords'
import { getApiBaseUrl } from './apiUrl'
import { COMPANY } from '@/constants/company'

interface QuotationItem {
  description?: string
  unit?: string
  quantity?: number
  unit_price?: number
}

interface QuotationContract {
  contract_number?: string
  signed_date?: string
  vat_rate?: number
  notes?: string
  delivery_days?: number
  warranty_months?: number
  created_by_name?: string
  items?: QuotationItem[]
  customer_name?: string
  customer_address?: string
  customer_tax_code?: string
  customer_contact_name?: string
  customer_contact_phone?: string
}

export interface QuotationExportOptions {
  /** Hiển thị người liên hệ và điện thoại trên báo giá */
  showContact?: boolean
  /** Nhân viên báo giá — người đang đăng nhập (không dùng người tạo HĐ) */
  sellerName?: string
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escMultiline(s: unknown): string {
  return esc(s).replace(/\r?\n/g, '<br>')
}

function fmtNum(n: number): string {
  return (Math.round(n) || 0).toLocaleString('en-US')
}

function fmtDate(d?: string): string {
  const date = d ? new Date(d) : new Date()
  if (isNaN(date.getTime())) return new Date().toLocaleDateString('vi-VN')
  return date.toLocaleDateString('vi-VN')
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function formatDeliveryText(days?: number): string {
  const n = Number(days) > 0 ? Number(days) : 7
  return `Giao hàng trong vòng ${n} ngày làm việc kể từ khi ký xác nhận đồng ý sửa chữa`
}

function formatWarrantyText(months?: number): string {
  const n = Number(months) > 0 ? Number(months) : 12
  return `Bảo hành ${n} tháng kể từ ngày giao hàng`
}

export function buildQuotationHtml(
  contract: QuotationContract,
  options: QuotationExportOptions = {},
  stampDataUrl = ''
): string {
  const showContact = options.showContact !== false
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const logoUrl = `${origin}/images/logo/SSElogo.png`
  const stampSrc = stampDataUrl || ''

  const items = Array.isArray(contract.items) ? contract.items : []
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  )
  const vatRate = Number(contract.vat_rate) || 0
  const vat = Math.round(subtotal * vatRate / 100)
  const total = subtotal + vat

  const baseDate = contract.signed_date ? new Date(contract.signed_date) : new Date()
  const issueDate = isNaN(baseDate.getTime()) ? new Date() : baseDate
  const expireDate = addDays(issueDate, 15)

  const contractNo = contract.contract_number || ''
  const quoteNo = contractNo ? `BG${contractNo}` : ''
  const seller = options.sellerName || ''
  const deliveryTime = formatDeliveryText(contract.delivery_days)
  const warrantyText = formatWarrantyText(contract.warranty_months)

  const rows = items.length
    ? items
        .map(
          (it, i) => `
        <tr>
          <td class="c">${i + 1}</td>
          <td>${escMultiline(it.description)}</td>
          <td class="c">${esc(it.unit) || 'Cái'}</td>
          <td class="c">${fmtNum(Number(it.quantity) || 0)}</td>
          <td class="r">${fmtNum(Number(it.unit_price) || 0)}</td>
          <td class="r">${fmtNum((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}</td>
        </tr>`
        )
        .join('')
    : `<tr><td class="c" colspan="6" style="color:#888">Chưa có hạng mục</td></tr>`

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Báo giá ${esc(quoteNo)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { background: #e5e7eb; }
  body {
    font-family: 'Times New Roman', Times, serif;
    color: #000;
    margin: 0;
    padding: 0;
    font-size: 13.5px;
    line-height: 1.4;
  }
  /* Khổ A4: 210mm x 297mm, lề 14mm => vùng nội dung 182mm */
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 16px auto;
    padding: 14mm;
    background: #fff;
    box-shadow: 0 0 8px rgba(0,0,0,0.15);
  }
  .header {
    display: flex;
    align-items: center;
    gap: 32px;
    border-bottom: 2px solid #1f4e79;
    padding-bottom: 10px;
  }
  .header img.logo {
    height: 92px;
    width: auto;
    flex-shrink: 0;
  }
  .company {
    flex: 1;
    padding-left: 28px;
    margin-left: 8px;
  }
  .company .name { color: #1f4e79; font-size: 17px; font-weight: bold; }
  .company .line { font-size: 12px; }
  h1.title { text-align: center; font-size: 24px; margin: 14px 0 12px; letter-spacing: 1px; }
  .info { display: flex; justify-content: space-between; gap: 24px; }
  .info .left { flex: 1; }
  .info .right { width: 250px; }
  .info .right table { width: 100%; border-collapse: collapse; }
  .info .right td { padding: 2px 0; vertical-align: top; }
  .info .right td.lbl { white-space: nowrap; }
  .info .right td.val { text-align: right; font-weight: bold; }
  .field { margin: 2px 0; }
  .field b { font-weight: bold; }
  .intro { margin: 12px 0 6px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 4px; }
  table.items th, table.items td { border: 1px solid #000; padding: 6px 8px; }
  table.items th { background: #f0f0f0; text-align: center; font-weight: bold; }
  table.items td.c { text-align: center; }
  table.items td.r { text-align: right; }
  table.items td.sum-lbl { text-align: center; font-weight: bold; }
  table.items td.sum-val { text-align: right; font-weight: bold; }
  .words { font-style: italic; margin: 8px 0 14px; }
  .notes b { font-weight: bold; }
  .notes .ln { margin: 2px 0; }
  .sign { display: flex; justify-content: space-between; margin-top: 28px; text-align: center; }
  .sign .col { width: 46%; position: relative; min-height: 170px; }
  .sign .role { font-weight: bold; }
  .sign .sub { font-style: italic; font-size: 12px; }
  .sign img.stamp { position: absolute; left: 50%; transform: translateX(-50%); top: 40px; height: 150px; width: auto; opacity: 0.96; }
  .sign .director-name { margin-top: 168px; font-weight: bold; }
  @page { size: A4; margin: 14mm; }
  @media print {
    html, body { background: #fff; }
    .no-print { display: none; }
    .page { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
  }
  .toolbar { text-align: center; margin-bottom: 16px; }
  .toolbar button { font-size: 14px; padding: 8px 18px; margin: 0 6px; cursor: pointer; border-radius: 6px; border: 1px solid #1f4e79; background: #1f4e79; color: #fff; }
  .toolbar button.sec { background: #fff; color: #1f4e79; }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">In / Lưu PDF</button>
    <button class="sec" onclick="window.close()">Đóng</button>
  </div>

  <div class="page">
  <div class="header">
    <img class="logo" src="${logoUrl}" alt="SSE" />
    <div class="company">
      <div class="name">${esc(COMPANY.name)}</div>
      <div class="line"><b>Địa chỉ:</b> ${esc(COMPANY.address)}</div>
      <div class="line"><b>MST:</b> ${esc(COMPANY.taxCode)}</div>
      <div class="line"><b>Email:</b> ${esc(COMPANY.email)}</div>
    </div>
  </div>

  <h1 class="title">BẢNG BÁO GIÁ</h1>

  <div class="info">
    <div class="left">
      <div class="field"><b>Tên khách hàng:</b> ${esc(contract.customer_name)}</div>
      <div class="field"><b>Địa chỉ:</b> ${esc(contract.customer_address)}</div>
      <div class="field"><b>Mã số thuế:</b> ${esc(contract.customer_tax_code)}</div>
      ${showContact ? `<div class="field"><b>Người liên hệ:</b> ${esc(contract.customer_contact_name)}</div>
      <div class="field"><b>Điện thoại:</b> ${esc(contract.customer_contact_phone)}</div>` : ''}
      <div class="field"><b>Nhân viên bán hàng:</b> ${esc(seller)}</div>
    </div>
    <div class="right">
      <table>
        <tr><td class="lbl">Số:</td><td class="val">${esc(quoteNo)}</td></tr>
        <tr><td class="lbl">Ngày:</td><td class="val">${fmtDate(issueDate.toISOString())}</td></tr>
        <tr><td class="lbl">Hiệu lực đến:</td><td class="val">${fmtDate(expireDate.toISOString())}</td></tr>
        <tr><td class="lbl">Loại tiền:</td><td class="val">VNĐ</td></tr>
      </table>
    </div>
  </div>

  <p class="intro">Chúng tôi trân trọng gửi đến Quý khách bảng chào giá thiết bị như sau:</p>

  <table class="items">
    <thead>
      <tr>
        <th style="width:6%">STT</th>
        <th>Hạng Mục</th>
        <th style="width:8%">ĐVT</th>
        <th style="width:10%">Số lượng</th>
        <th style="width:16%">Đơn Giá</th>
        <th style="width:16%">Thành Tiền</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr>
        <td class="sum-lbl" colspan="5">Tổng cộng:</td>
        <td class="sum-val">${fmtNum(subtotal)}</td>
      </tr>
      <tr>
        <td class="sum-lbl" colspan="5">Thuế GTGT (${vatRate}%):</td>
        <td class="sum-val">${fmtNum(vat)}</td>
      </tr>
      <tr>
        <td class="sum-lbl" colspan="5">Tổng cộng thanh toán:</td>
        <td class="sum-val">${fmtNum(total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="words"><b>Bằng chữ:</b> ${esc(amountToVietnameseWords(total))}</div>

  <div class="notes">
    <div><b>Ghi Chú:</b></div>
    <div class="ln">+ Bảo hành: ${esc(warrantyText)}</div>
    <div class="ln">+ Thanh toán: Thanh toán 100% giá trị sửa chữa thiết bị trước khi giao hàng</div>
    <div class="ln">+ Thời gian giao hàng: ${esc(deliveryTime)}</div>
    <div class="ln">Trân trọng cảm ơn Quý khách.</div>
  </div>

  <div class="sign">
    <div class="col">
      <div class="role">Xác nhận của khách hàng</div>
      <div class="sub">(Ký, họ tên)</div>
    </div>
    <div class="col">
      <div class="role">Giám đốc</div>
      <div class="sub">(Ký, họ tên, đóng dấu)</div>
      ${stampSrc ? `<img class="stamp" src="${stampSrc}" alt="stamp" />` : ''}
      <div class="director-name">${esc(COMPANY.representative)}</div>
    </div>
  </div>
  </div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  </script>
</body>
</html>`
}

/**
 * Tải con dấu qua API (yêu cầu đăng nhập nhân viên), trả về data URL để nhúng vào HTML in.
 */
async function fetchStampDataUrl(): Promise<string> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
  }
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/quotation/stamp`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          'Không tìm thấy file con dấu trên server. Quản trị cần deploy lại backend (npm run build) kèm stamp.png hoặc cấu hình STAMP_IMAGE_PATH.',
        )
      }
      if (res.status === 403) {
        throw new Error('Tài khoản không có quyền lấy con dấu báo giá.')
      }
      throw new Error(`Không thể tải con dấu (HTTP ${res.status}).`)
    }
    const blob = await res.blob()
    if (!blob.size) {
      throw new Error('File con dấu trống hoặc không hợp lệ.')
    }
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
          resolve(reader.result)
        } else {
          reject(new Error('Không đọc được file con dấu.'))
        }
      }
      reader.onerror = () => reject(new Error('Không đọc được file con dấu.'))
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Không thể tải con dấu báo giá.')
  }
}

/**
 * Mở cửa sổ in báo giá từ dữ liệu hợp đồng. Người dùng có thể chọn "Lưu PDF".
 */
export async function exportQuotation(
  contract: QuotationContract,
  options: QuotationExportOptions = {}
): Promise<void> {
  // Mở cửa sổ NGAY LẬP TỨC (đồng bộ) trong cùng user-event handler
  // để tránh bị trình duyệt chặn popup (Mac Safari / Chrome mobile)
  const win = window.open('', '_blank')
  if (!win) {
    alert('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép pop-up để xuất báo giá.')
    return
  }

  // Hiển thị màn hình loading trong cửa sổ mới trong khi tải dữ liệu
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Đang tải...</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#555}
    .spinner{width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}
    @keyframes spin{to{transform:rotate(360deg)}}</style></head>
    <body><div><div class="spinner"></div><p>Đang tạo báo giá...</p></div></body></html>`)

  try {
    const stampDataUrl = await fetchStampDataUrl()
    const html = buildQuotationHtml(contract, options, stampDataUrl)
    win.document.open()
    win.document.write(html)
    win.document.close()
  } catch (err) {
    win.document.open()
    win.document.write(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#dc2626">
      <h3>Lỗi tạo báo giá</h3><p>${err instanceof Error ? err.message : 'Đã có lỗi xảy ra.'}</p>
      <button onclick="window.close()">Đóng</button></body></html>`)
    win.document.close()
  }
}
