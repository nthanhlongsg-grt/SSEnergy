import { UserRole, isAdminRole } from '../types/index.js'

export const canViewContractFinance = (role?: UserRole | string | null): boolean => {
  if (!role) return false
  const normalized = String(role).toLowerCase()
  if (normalized === UserRole.ADMIN || normalized === UserRole.DEV) return true
  return normalized === UserRole.ACCOUNTING
}

/** Tạo / sửa hợp đồng — admin, dev, trung tâm dịch vụ, kế toán */
export const canManageContracts = (role?: UserRole | string | null): boolean => {
  if (!role) return false
  if (isAdminRole(role as UserRole)) return true
  return role === UserRole.SERVICE_CENTER || role === UserRole.ACCOUNTING
}

/** Ẩn giá trị HĐ, VAT, đơn giá hạng mục — chỉ admin/dev/kế toán xem được */
export const stripContractFinancialFields = (
  role: UserRole | string | undefined | null,
  contract: Record<string, unknown>,
): void => {
  if (canViewContractFinance(role)) return

  delete contract.value
  delete contract.vat_rate

  if (Array.isArray(contract.items)) {
    contract.items = (contract.items as Array<Record<string, unknown>>).map(({ description, unit, quantity }) => ({
      description,
      unit,
      quantity,
    }))
  }
}
