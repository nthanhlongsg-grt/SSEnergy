import QRCode from 'qrcode'
import { resolveBankBin } from '@/data/vnBanks'

export interface VietQrParams {
  bankNameOrBin: string
  accountNumber: string
  accountName?: string
  amount?: number
  addInfo?: string
}

/** CRC16-CCITT-FALSE cho payload EMVCo VietQR */
function crc16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

/** Tạo chuỗi payload VietQR (NAPAS247 / EMVCo) */
export function buildVietQrPayload(params: VietQrParams): string | null {
  const bin = resolveBankBin(params.bankNameOrBin)
  const account = params.accountNumber.replace(/\D/g, '')
  if (!bin || !account) return null

  const accountName = (params.accountName || '').trim().toUpperCase().slice(0, 50)
  const amount = params.amount && params.amount > 0 ? Math.round(params.amount) : undefined
  const addInfo = (params.addInfo || '').trim().slice(0, 25)

  const merchantAccount = tlv('00', bin) + tlv('01', account)
  const consumerBlock = tlv('00', 'A000000727') + tlv('01', merchantAccount)

  let payload =
    tlv('00', '01') +
    tlv('01', amount !== undefined ? '11' : '12') +
    tlv('38', consumerBlock) +
    tlv('53', '704')

  if (amount !== undefined) {
    payload += tlv('54', String(amount))
  }

  payload += tlv('58', 'VN')

  if (addInfo) {
    payload += tlv('62', tlv('08', addInfo))
  }

  if (accountName) {
    payload += tlv('59', accountName)
  }

  const toChecksum = payload + '6304'
  payload += tlv('63', crc16(toChecksum))
  return payload
}

/** URL ảnh QR từ VietQR.io (fallback khi cần hiển thị nhanh) */
export function buildVietQrImageUrl(params: VietQrParams): string | null {
  const bin = resolveBankBin(params.bankNameOrBin)
  const account = params.accountNumber.replace(/\D/g, '')
  if (!bin || !account) return null

  const base = `https://img.vietqr.io/image/${bin}-${account}-compact2.png`
  const q = new URLSearchParams()
  if (params.amount && params.amount > 0) q.set('amount', String(Math.round(params.amount)))
  if (params.addInfo) q.set('addInfo', params.addInfo.slice(0, 25))
  if (params.accountName) q.set('accountName', params.accountName)
  const qs = q.toString()
  return qs ? `${base}?${qs}` : base
}

/** Sinh QR dạng data URL (client-side, không phụ thuộc API ngoài) */
export async function generateVietQrDataUrl(params: VietQrParams): Promise<string | null> {
  const payload = buildVietQrPayload(params)
  if (!payload) return null
  return QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
}
