// HTML Template for Service Report
import { renderReplacementPartsSection } from '../utils/replacementParts.js'

export function generateReportHTML(data: {
  ticket: any
  ticketId: number
  service_date: string | null
  completion_date: string | null
  diagnosis: string | null
  actions_taken: string | null
  replacement_parts: string | null
  beforeImagesArray: string[]
  afterImagesArray: string[]
  customer_signature: string | null
  technician_signature: string | null
  logoUrl: string
}) {
  const {
    ticket,
    ticketId,
    service_date,
    completion_date,
    diagnosis,
    actions_taken,
    replacement_parts,
    beforeImagesArray,
    afterImagesArray,
    customer_signature,
    technician_signature,
    logoUrl
  } = data

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  // Format date for report creation date (only date, no time)
  const formatReportDate = (dateStr: string | null) => {
    if (!dateStr) return new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    }
  }

  // Get labels (bilingual)
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'new': 'New / Mới',
      'assigned': 'Assigned / Đã phân công',
      'in_progress': 'In Progress / Đang xử lý',
      'completed': 'Completed / Hoàn thành',
      'closed': 'Closed / Đã đóng',
      'cancelled': 'Cancelled / Đã hủy'
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'low': 'Low / Thấp',
      'medium': 'Medium / Trung bình',
      'high': 'High / Cao',
      'urgent': 'Urgent / Khẩn cấp'
    }
    return labels[priority] || priority
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'warranty': 'Warranty / Bảo hành',
      'repair': 'Repair / Sửa chữa',
      'maintenance': 'Maintenance / Bảo trì',
      'installation': 'Installation / Lắp đặt',
      'consultation': 'Consultation / Tư vấn'
    }
    return labels[category] || category
  }

  const escapeHtml = (text: string) => {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Bilingual labels helper (English / Tiếng Việt)
  const bilingualLabels: Record<string, { en: string; vi: string }> = {
    'service_report': { en: 'Service Report', vi: 'Báo cáo Dịch vụ' },
    'ticket_info': { en: 'Ticket Information', vi: 'Thông tin Ticket' },
    'customer_info': { en: 'Customer Information', vi: 'Thông tin Khách hàng' },
    'device_info': { en: 'Device Information', vi: 'Thông tin Thiết bị' },
    'assignee': { en: 'Responsible Person', vi: 'Người phụ trách' },
    'ticket_code': { en: 'Ticket Code', vi: 'Mã Ticket' },
    'ticket_type': { en: 'Ticket Type', vi: 'Loại Ticket' },
    'created_date': { en: 'Created Date', vi: 'Ngày tạo' },
    'status': { en: 'Status', vi: 'Trạng thái' },
    'priority': { en: 'Priority', vi: 'Độ ưu tiên' },
    'close_date': { en: 'Ticket Close Date', vi: 'Ngày đóng ticket' },
    'name': { en: 'Name', vi: 'Tên' },
    'phone': { en: 'Phone Number', vi: 'Số điện thoại' },
    'email': { en: 'Email', vi: 'Email' },
    'address': { en: 'Address', vi: 'Địa chỉ' },
    'model': { en: 'Model', vi: 'Model' },
    'serial_number': { en: 'Serial Number', vi: 'Số Serial' },
    'error_type': { en: 'Error Type', vi: 'Loại lỗi' },
    'warranty_expiry': { en: 'Warranty Expiry', vi: 'Hạn bảo hành' },
    'diagnosis': { en: 'Diagnosis / Cause', vi: 'Chẩn đoán / Nguyên nhân' },
    'actions_taken': { en: 'Actions Taken', vi: 'Hành động đã thực hiện' },
    'replacement_parts': { en: 'Replacement Parts', vi: 'Linh kiện thay thế' },
    'images': { en: 'Images', vi: 'Hình ảnh' },
    'before_repair': { en: 'Before Repair', vi: 'Trước khi sửa chữa' },
    'after_repair': { en: 'After Repair', vi: 'Sau khi sửa chữa' },
    'image': { en: 'Image', vi: 'Hình' },
    'image_number': { en: 'Image', vi: 'Hình' },
    'signatures': { en: 'Signatures', vi: 'Chữ ký' },
    'customer': { en: 'Customer', vi: 'Khách hàng' },
    'technician': { en: 'Responsible Technician', vi: 'Kỹ thuật viên phụ trách' },
    'report_generated': { en: 'Report automatically generated by SGE Vietnam system', vi: 'Báo cáo được tạo tự động từ hệ thống SGE Vietnam' },
    'created_at': { en: 'Created at', vi: 'Ngày tạo' }
  }

  const bilingual = (key: string): string => {
    const label = bilingualLabels[key]
    if (!label) return key
    return `${label.en} / ${label.vi}`
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bilingual('service_report')} - ${ticket.ticket_number || ticketId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f3f4f6;
      padding: 24px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: white;
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .header-left {
      display: flex;
      align-items: center;
    }
    .logo {
      height: 80px;
      width: auto;
      max-width: 250px;
      object-fit: contain;
    }
    .logo-placeholder {
      height: 60px;
      display: flex;
      align-items: center;
      font-size: 32px;
      font-weight: 700;
      color: #10b981;
      letter-spacing: 2px;
    }
    .header-right {
      display: flex;
      align-items: center;
    }
    .ticket-info-box {
      padding: 12px 20px;
      background: white;
      min-width: 250px;
    }
    .ticket-info-number {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .ticket-info-category {
      font-size: 13px;
      color: #6b7280;
      font-weight: 400;
    }
    .content {
      padding: 24px;
    }
    .ticket-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    }
    .ticket-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .ticket-subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    .grid-2x2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 14px;
      color: #111827;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-completed {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-medium {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-high {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-low {
      background: #e0e7ff;
      color: #3730a3;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #10b981;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .content-box {
      background: #f9fafb;
      padding: 16px;
      border-radius: 6px;
      white-space: pre-wrap;
      line-height: 1.8;
      color: #374151;
      font-size: 14px;
    }
    .image-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 16px;
    }
    .image-group {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .image-group-title {
      font-size: 14px;
      font-weight: 600;
      color: #10b981;
      margin-bottom: 12px;
    }
    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }
    .image-item {
      text-align: center;
    }
    .image-item img {
      width: 100%;
      height: auto;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .image-label {
      font-size: 11px;
      color: #6b7280;
    }
    .signature-section {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
    }
    .signature-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 24px;
    }
    .signature-box {
      text-align: center;
      background: #f9fafb;
      padding: 24px;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
    }
    .signature-label {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .signature-image {
      max-width: 100%;
      height: auto;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      margin: 12px 0;
      background: white;
    }
    .signature-info {
      margin-top: 12px;
      font-size: 13px;
      color: #6b7280;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Logo -->
    <div class="header">
      <div class="header-left">
        ${logoUrl ? `<img src="${logoUrl}" alt="SGE Logo" class="logo" />` : '<div class="logo-placeholder">SGE</div>'}
      </div>
      <div class="header-right">
        <div class="ticket-info-box">
          <div class="ticket-info-number">Ticket #${ticket.ticket_number || ticketId}</div>
          <div class="ticket-info-category">${new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- 2x2 Grid Cards (like ticket detail page) -->
      <div class="grid-2x2">
        <!-- Ticket Information Card -->
        <div class="card">
          <div class="card-title">${bilingual('ticket_info')}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">${bilingual('ticket_code')}</div>
              <div class="info-value">#${ticket.ticket_number || ticketId}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('ticket_type')}</div>
              <div class="info-value">${getCategoryLabel(ticket.category || '')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('created_date')}</div>
              <div class="info-value">${formatDate(ticket.created_at)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('status')}</div>
              <div class="info-value">
                <span class="badge badge-completed">${getStatusLabel(ticket.status || '')}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('priority')}</div>
              <div class="info-value">
                <span class="badge badge-${ticket.priority || 'medium'}">${getPriorityLabel(ticket.priority || '')}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('close_date')}</div>
              <div class="info-value">${completion_date ? formatDate(completion_date) : 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Customer Information Card -->
        <div class="card">
          <div class="card-title">${bilingual('customer_info')}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">${bilingual('name')}</div>
              <div class="info-value">${escapeHtml(ticket.customer_name || 'N/A')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('phone')}</div>
              <div class="info-value">${escapeHtml(ticket.customer_phone || 'N/A')}</div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">${bilingual('email')}</div>
              <div class="info-value">${escapeHtml(ticket.customer_email || 'N/A')}</div>
            </div>
            ${ticket.customer_address ? `
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">${bilingual('address')}</div>
              <div class="info-value">${escapeHtml(ticket.customer_address)}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Device Information Card -->
        <div class="card">
          <div class="card-title">${bilingual('device_info')}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">${bilingual('model')}</div>
              <div class="info-value">${escapeHtml(ticket.inverter_model || 'N/A')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('serial_number')}</div>
              <div class="info-value">${escapeHtml(ticket.inverter_serial || 'N/A')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('error_type')}</div>
              <div class="info-value">${getCategoryLabel(ticket.category || '')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${bilingual('warranty_expiry')}</div>
              <div class="info-value">${ticket.inverter_warranty_end_date ? formatReportDate(ticket.inverter_warranty_end_date) : 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Assignee Information Card -->
        <div class="card">
          <div class="card-title">${bilingual('assignee')}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">${bilingual('name')}</div>
              <div class="info-value">${escapeHtml(ticket.technician_name || 'N/A')}</div>
            </div>
            ${ticket.technician_phone ? `
            <div class="info-item">
              <div class="info-label">${bilingual('phone')}</div>
              <div class="info-value">${escapeHtml(ticket.technician_phone)}</div>
            </div>
            ` : ''}
            ${ticket.technician_email ? `
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">${bilingual('email')}</div>
              <div class="info-value">${escapeHtml(ticket.technician_email)}</div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Service Details Section -->
      <div class="section">
        ${diagnosis ? `
        <div style="margin-bottom: 24px;">
          <div class="section-title" style="font-size: 16px; margin-bottom: 12px;">${bilingual('diagnosis')}</div>
          <div class="content-box">${escapeHtml(diagnosis).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        ${actions_taken ? `
        <div style="margin-bottom: 24px;">
          <div class="section-title" style="font-size: 16px; margin-bottom: 12px;">${bilingual('actions_taken')}</div>
          <div class="content-box">${escapeHtml(actions_taken).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        ${replacement_parts ? renderReplacementPartsSection(replacement_parts, escapeHtml, bilingual('replacement_parts')) : ''}
      </div>

      <!-- Images Section -->
      ${(beforeImagesArray.length > 0 || afterImagesArray.length > 0) ? `
      <div class="section">
        <div class="section-title">${bilingual('images')}</div>
        <div class="image-section">
          ${beforeImagesArray.length > 0 ? `
          <div class="image-group">
            <div class="image-group-title">${bilingual('before_repair')}</div>
            <div class="image-grid">
              ${beforeImagesArray.map((img: string, idx: number) => `
                <div class="image-item">
                  <img src="${img}" alt="Before ${idx + 1}" />
                  <div class="image-label">${bilingual('image_number')} ${idx + 1}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          ${afterImagesArray.length > 0 ? `
          <div class="image-group">
            <div class="image-group-title">${bilingual('after_repair')}</div>
            <div class="image-grid">
              ${afterImagesArray.map((img: string, idx: number) => `
                <div class="image-item">
                  <img src="${img}" alt="After ${idx + 1}" />
                  <div class="image-label">${bilingual('image_number')} ${idx + 1}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Signature Section -->
      ${(customer_signature || technician_signature) ? `
      <div class="signature-section">
        <div class="section-title">${bilingual('signatures')}</div>
        <div class="signature-container">
          ${customer_signature ? `
          <div class="signature-box">
            <div class="signature-label">${bilingual('customer')}</div>
            <img src="${customer_signature}" alt="Customer Signature" class="signature-image" />
            ${completion_date ? `
            <div class="signature-info">
              ${formatDate(completion_date)}
            </div>
            ` : ''}
          </div>
          ` : '<div></div>'}
          ${technician_signature ? `
          <div class="signature-box">
            <div class="signature-label">${bilingual('technician')}</div>
            <img src="${technician_signature}" alt="Technician Signature" class="signature-image" />
            ${completion_date ? `
            <div class="signature-info">
              ${formatDate(completion_date)}
            </div>
            ` : ''}
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Footer -->
      <div class="footer">
        <p>${bilingual('report_generated')}</p>
        <p style="margin-top: 8px;">${bilingual('created_at')}: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

