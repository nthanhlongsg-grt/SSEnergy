/** Hiển thị SN kèm số hợp đồng: `SN - CT-001` hoặc nhiều HĐ nối bằng ` · ` */
export function serialWithContractLabel(
  serialNumber?: string | null,
  contractNumbers?: string | null
): string {
  const sn = serialNumber?.trim()
  if (!sn) return '—'
  if (!contractNumbers?.trim()) return sn
  return contractNumbers
    .split(',')
    .map(cn => `${sn} - ${cn.trim()}`)
    .filter(Boolean)
    .join(' · ')
}
