/** Ngân hàng Việt Nam — mã BIN (NAPAS) cho VietQR */
export interface VnBank {
  bin: string
  code: string
  name: string
  shortName: string
}

export const VN_BANKS: VnBank[] = [
  { bin: '970436', code: 'VCB', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', shortName: 'Vietcombank' },
  { bin: '970422', code: 'MB', name: 'Ngân hàng TMCP Quân đội', shortName: 'MB Bank' },
  { bin: '970407', code: 'TCB', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', shortName: 'Techcombank' },
  { bin: '970415', code: 'CTG', name: 'Ngân hàng TMCP Công thương Việt Nam', shortName: 'VietinBank' },
  { bin: '970418', code: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', shortName: 'BIDV' },
  { bin: '970432', code: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { bin: '970423', code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank' },
  { bin: '970403', code: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank' },
  { bin: '970441', code: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam', shortName: 'VIB' },
  { bin: '970426', code: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam', shortName: 'MSB' },
  { bin: '970448', code: 'OCB', name: 'Ngân hàng TMCP Phương Đông', shortName: 'OCB' },
  { bin: '970437', code: 'HDB', name: 'Ngân hàng TMCP Phát triển TP.HCM', shortName: 'HDBank' },
  { bin: '970416', code: 'ACB', name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB' },
  { bin: '970405', code: 'VBA', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn', shortName: 'Agribank' },
  { bin: '970454', code: 'VCCB', name: 'Ngân hàng TMCP Bản Việt', shortName: 'VietCapitalBank' },
  { bin: '970429', code: 'SCB', name: 'Ngân hàng TMCP Sài Gòn', shortName: 'SCB' },
  { bin: '970414', code: 'OJB', name: 'Ngân hàng TMCP Đại Dương', shortName: 'OceanBank' },
  { bin: '970431', code: 'EIB', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam', shortName: 'Eximbank' },
  { bin: '970443', code: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', shortName: 'SHB' },
  { bin: '970449', code: 'LPB', name: 'Ngân hàng TMCP Lộc Phát Việt Nam', shortName: 'LPBank' },
  { bin: '970452', code: 'KLB', name: 'Ngân hàng TMCP Kiên Long', shortName: 'KienLongBank' },
  { bin: '970458', code: 'UOB', name: 'Ngân hàng United Overseas Bank', shortName: 'UOB' },
  { bin: '970440', code: 'SEAB', name: 'Ngân hàng TMCP Đông Nam Á', shortName: 'SeABank' },
  { bin: '970424', code: 'SHBVN', name: 'Ngân hàng Shinhan Việt Nam', shortName: 'Shinhan Bank' },
  { bin: '970427', code: 'VAB', name: 'Ngân hàng TMCP Việt Á', shortName: 'VietABank' },
  { bin: '970428', code: 'NAB', name: 'Ngân hàng TMCP Nam Á', shortName: 'Nam A Bank' },
  { bin: '970433', code: 'VIETBANK', name: 'Ngân hàng TMCP Việt Nam Thương Tín', shortName: 'VietBank' },
  { bin: '970438', code: 'BVB', name: 'Ngân hàng TMCP Bảo Việt', shortName: 'BaoViet Bank' },
  { bin: '970446', code: 'COOPBANK', name: 'Ngân hàng Hợp tác xã Việt Nam', shortName: 'Co-opBank' },
  { bin: '970457', code: 'WVN', name: 'Ngân hàng Woori Việt Nam', shortName: 'Woori Bank' },
  { bin: '970462', code: 'KOOKMIN', name: 'Ngân hàng Kookmin Việt Nam', shortName: 'Kookmin Bank' },
]

export function resolveBankBin(bankNameOrBin: string | null | undefined): string | null {
  if (!bankNameOrBin?.trim()) return null
  const q = bankNameOrBin.trim().toLowerCase()
  const qNorm = q.replace(/\s+/g, '')
  if (/^\d{6}$/.test(qNorm)) return qNorm

  const bank = VN_BANKS.find((b) => {
    const shortNorm = b.shortName.replace(/\s+/g, '').toLowerCase()
    const codeNorm = b.code.replace(/\s+/g, '').toLowerCase()
    return (
      b.bin === qNorm ||
      codeNorm === qNorm ||
      shortNorm === qNorm ||
      b.shortName.toLowerCase() === q ||
      shortNorm.includes(qNorm) ||
      qNorm.includes(shortNorm) ||
      b.name.toLowerCase().includes(q) ||
      q.includes(codeNorm)
    )
  })
  return bank?.bin ?? null
}

export function getBankByBin(bin: string): VnBank | undefined {
  return VN_BANKS.find((b) => b.bin === bin)
}

export function getBankLabel(bankName: string | null | undefined): string {
  if (!bankName) return '—'
  const bin = resolveBankBin(bankName)
  if (bin) {
    const b = getBankByBin(bin)
    return b ? `${b.shortName} (${b.bin})` : bankName
  }
  return bankName
}

/** Khớp tên ngân hàng tự do → shortName trong dropdown */
export function matchBankSelectValue(bankName: string | null | undefined): string {
  if (!bankName?.trim()) return ''
  const bin = resolveBankBin(bankName)
  if (bin) {
    const b = getBankByBin(bin)
    if (b) return b.shortName
  }
  const q = bankName.trim().toLowerCase()
  const found = VN_BANKS.find((b) => b.shortName.toLowerCase() === q)
  return found?.shortName || ''
}
