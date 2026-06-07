/**
 * Customer Routes
 * Routes dành cho nhóm khách hàng (end_user, distributor)
 */

import { UserRole } from '@/composables/useAuth'

export const customerRoutes = [
  {
    path: '/customer',
    redirect: '/customer/dashboard',
  },
  {
    path: '/customer/dashboard',
    name: 'CustomerDashboard',
    component: () => import('@/views/Customer/Dashboard.vue'),
    meta: {
      title: 'Dashboard',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/inverters',
    name: 'CustomerInverters',
    component: () => import('@/views/Customer/Inverters/InverterList.vue'),
    meta: {
      title: 'Danh sách Biến tần',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/inverters/:id',
    name: 'CustomerInverterDetail',
    component: () => import('@/views/Customer/Inverters/InverterDetail.vue'),
    meta: {
      title: 'Chi tiết Thiết bị',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/contracts',
    name: 'CustomerContracts',
    component: () => import('@/views/Customer/Contracts/ContractList.vue'),
    meta: {
      title: 'Hợp đồng',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/contracts/:id',
    name: 'CustomerContractDetail',
    component: () => import('@/views/SGE/Contracts/ContractDetail.vue'),
    meta: {
      title: 'Chi tiết Hợp đồng',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/tickets',
    name: 'CustomerTickets',
    component: () => import('@/views/Customer/Tickets/TicketList.vue'),
    meta: {
      title: 'Yêu cầu Hỗ trợ',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/tickets/new',
    name: 'CustomerNewTicket',
    component: () => import('@/views/Customer/Tickets/NewTicket.vue'),
    meta: {
      title: 'Tạo Yêu cầu mới',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/tickets/:id',
    name: 'CustomerTicketDetail',
    component: () => import('@/views/Customer/Tickets/TicketDetail.vue'),
    meta: {
      title: 'Chi tiết Yêu cầu',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/profile',
    name: 'CustomerProfile',
    component: () => import('@/views/Customer/Profile.vue'),
    meta: {
      title: 'Thông tin Cá nhân',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/notifications',
    name: 'CustomerNotifications',
    component: () => import('@/views/Customer/Notifications.vue'),
    meta: {
      title: 'Thông báo',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/warranty-policy',
    name: 'CustomerWarrantyPolicy',
    component: () => import('@/views/Policies/WarrantyPolicy.vue'),
    meta: {
      title: 'Chính sách bảo hành',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/search',
    name: 'CustomerSearchResults',
    component: () => import('@/views/SearchResults.vue'),
    meta: {
      title: 'Kết quả tìm kiếm',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
  {
    path: '/customer/service-reports/:id',
    name: 'CustomerServiceReportDetail',
    component: () => import('@/views/Customer/ServiceReports/ServiceReportDetail.vue'),
    meta: {
      title: 'Chi tiết Biên bản Dịch vụ',
      requiresAuth: true,
      userGroup: 'customer',
      allowedRoles: [UserRole.END_USER, UserRole.DISTRIBUTOR],
    },
  },
]

