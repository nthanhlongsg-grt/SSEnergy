import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, hasPermission, initAuth, getUserRole, UserRole } from '@/composables/useAuth'
import { customerRoutes } from './customerRoutes'
import { canAccessRoute, getRedirectRoute } from '@/utils/routeGuard'
import { isCustomerRole, isManagementRole, getUserGroup, getDefaultRouteByRole } from '@/utils/userGroups'

// Track if auth initialization is complete
let authInitialized = false
const initAuthPromise = initAuth().then(() => {
  authInitialized = true
}).catch((error) => {
  console.error('Error initializing auth:', error)
  authInitialized = true // Continue even if init fails
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/SSE/Dashboard.vue'),
      meta: {
        title: 'SSE After-Sales Dashboard',
        requiresAuth: true,
        userGroup: 'management',
      },
    },
    // Quản lý Thiết bị (Inverter Management)
    {
      path: '/inverters',
      name: 'Inverters',
      component: () => import('../views/SSE/Inverters/InverterList.vue'),
      meta: {
        title: 'Danh sách Biến tần',
        requiresAuth: true,
        requiresPermission: 'view_inverters',
      },
    },
    {
      path: '/inverters/:id',
      name: 'InverterDetail',
      component: () => import('../views/SSE/Inverters/InverterDetail.vue'),
      meta: {
        title: 'Chi tiết Thiết bị',
        requiresAuth: true,
        requiresPermission: 'view_inverters',
      },
    },
    // Quản lý Khách hàng
    {
      path: '/customers',
      name: 'Customers',
      component: () => import('../views/SSE/Customers/CustomerList.vue'),
      meta: {
        title: 'Quản lý Khách hàng',
        requiresAuth: true,
        requiresPermission: 'view_customers',
        userGroup: 'management',
      },
    },
    {
      path: '/customers/:id',
      name: 'CustomerDetail',
      component: () => import('../views/SSE/Customers/CustomerDetail.vue'),
      meta: {
        title: 'Chi tiết Khách hàng',
        requiresAuth: true,
        requiresPermission: 'view_customers',
        userGroup: 'management',
      },
    },
    // Ticket & Warranty Service Request
    {
      path: '/tickets',
      name: 'Tickets',
      component: () => import('../views/SSE/Tickets/TicketList.vue'),
      meta: {
        title: 'Quản lý Ticket',
        requiresAuth: true,
        requiresPermission: 'view_tickets',
        userGroup: 'management',
      },
    },
    {
      path: '/tickets/new',
      name: 'NewTicket',
      component: () => import('../views/SSE/Tickets/NewTicket.vue'),
      meta: {
        title: 'Tạo Ticket mới',
        requiresAuth: true,
        requiresPermission: 'create_ticket',
        userGroup: 'management',
      },
    },
    {
      path: '/tickets/:id',
      name: 'TicketDetail',
      component: () => import('../views/SSE/Tickets/TicketDetail.vue'),
      meta: {
        title: 'Chi tiết Ticket',
        requiresAuth: true,
        requiresPermission: 'view_tickets',
        userGroup: 'management',
      },
    },
    // Notifications
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('../views/SSE/Notifications.vue'),
      meta: {
        title: 'Thông báo',
        requiresAuth: true,
        userGroup: 'management',
      },
    },
    // Điều phối Kỹ thuật
    {
      path: '/technicians',
      name: 'Technicians',
      component: () => import('../views/SSE/Technicians/TechnicianList.vue'),
      meta: {
        title: 'Quản lý Kỹ thuật',
        requiresAuth: true,
        requiresPermission: 'view_technicians',
        userGroup: 'management',
      },
    },
    {
      path: '/technicians/schedule',
      name: 'TechnicianSchedule',
      component: () => import('../views/SSE/Technicians/TechnicianSchedule.vue'),
      meta: {
        title: 'Lịch Kỹ thuật viên',
        requiresAuth: true,
        requiresPermission: 'view_technicians',
        userGroup: 'management',
      },
    },
    {
      path: '/tasks/:id',
      name: 'TaskDetail',
      component: () => import('../views/SSE/Tasks/TaskDetail.vue'),
      meta: {
        title: 'Chi tiết Công việc',
        requiresAuth: true,
        requiresPermission: 'view_technicians',
        userGroup: 'management',
      },
    },
    // Quản lý Kho & Linh kiện
    {
      path: '/warehouse',
      name: 'Warehouse',
      component: () => import('../views/SSE/Warehouse/WarehouseList.vue'),
      meta: {
        title: 'Quản lý Kho',
        requiresAuth: true,
        requiresPermission: 'view_warehouse',
        userGroup: 'management',
      },
    },
    {
      path: '/warehouse/parts',
      name: 'PartsManagement',
      component: () => import('../views/SSE/Warehouse/PartsManagement.vue'),
      meta: {
        title: 'Quản lý Linh kiện',
        requiresAuth: true,
        requiresPermission: 'view_warehouse',
        userGroup: 'management',
      },
    },
    {
      path: '/warehouse/rma',
      name: 'RMAManagement',
      component: () => import('../views/SSE/Warehouse/RMAManagement.vue'),
      meta: {
        title: 'Quản lý RMA',
        requiresAuth: true,
        requiresPermission: 'view_warehouse',
        userGroup: 'management',
      },
    },
    // Lịch sử sửa chữa & Biên bản
    {
      path: '/service-reports',
      name: 'ServiceReports',
      component: () => import('../views/SSE/ServiceReports/ServiceReportList.vue'),
      meta: {
        title: 'Biên bản Dịch vụ',
        requiresAuth: true,
        requiresPermission: 'view_reports',
        userGroup: 'management',
      },
    },
    {
      path: '/service-reports/:id',
      name: 'ServiceReportDetail',
      component: () => import('../views/SSE/ServiceReports/ServiceReportDetail.vue'),
      meta: {
        title: 'Chi tiết Biên bản',
        requiresAuth: true,
        requiresPermission: 'view_reports',
        userGroup: 'management',
      },
    },
    // Quản lý Hợp đồng
    {
      path: '/contracts',
      name: 'Contracts',
      component: () => import('../views/SSE/Contracts/ContractList.vue'),
      meta: {
        title: 'Quản lý Hợp đồng',
        requiresAuth: true,
        requiresPermission: 'view_contracts',
        userGroup: 'management',
      },
    },
    {
      path: '/contracts/:id',
      name: 'ContractDetail',
      component: () => import('../views/SSE/Contracts/ContractDetail.vue'),
      meta: {
        title: 'Chi tiết Hợp đồng',
        requiresAuth: true,
        requiresPermission: 'view_contracts',
        userGroup: 'management',
      },
    },
    // Quản lý Người dùng & Phân quyền
    {
      path: '/users',
      name: 'UserManagement',
      component: () => import('../views/SSE/Users/UserManagement.vue'),
      meta: {
        title: 'Quản lý Người dùng',
        requiresAuth: true,
        requiresPermission: 'view_users',
        userGroup: 'management',
      },
    },
    {
      path: '/settings/auto-assign',
      name: 'AutoAssignSettings',
      component: () => import('../views/SSE/Settings/AutoAssignSettings.vue'),
      meta: {
        title: 'Auto-assign Settings',
        requiresAuth: true,
        requiresPermission: 'manage_roles',
        userGroup: 'management',
      },
    },
    {
      path: '/settings/sla',
      name: 'SlaSettings',
      component: () => import('../views/SSE/Settings/SlaSettings.vue'),
      meta: {
        title: 'SLA Settings',
        requiresAuth: true,
        requiresPermission: 'manage_roles',
        userGroup: 'management',
      },
    },
    {
      path: '/search',
      name: 'SearchResults',
      component: () => import('../views/SearchResults.vue'),
      meta: {
        title: 'Kết quả tìm kiếm',
        requiresAuth: true,
      },
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/Others/Calendar.vue'),
      meta: {
        title: 'Calendar',
        requiresAuth: true,
      },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: {
        title: 'Profile',
        requiresAuth: true,
      },
    },
    {
      path: '/support',
      name: 'Support',
      component: () => import('../views/Others/Support.vue'),
      meta: {
        title: 'Hỗ trợ',
        requiresAuth: true,
      },
    },
    {
      path: '/warranty-policy',
      name: 'WarrantyPolicy',
      component: () => import('../views/Policies/WarrantyPolicy.vue'),
      meta: {
        title: 'Chính sách bảo hành',
        requiresAuth: true,
      },
    },

    {
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: {
        title: '404 Error',
        layout: 'blank',
      },
    },

    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Signin',
        layout: 'blank',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Signup',
        layout: 'blank',
      },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      redirect: '/signin', // Redirect to signin for now
      meta: {
        title: 'Reset Password',
        layout: 'blank',
      },
    },
    // Customer routes (end_user, distributor)
    ...customerRoutes,
  ],
})

export default router

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || 'SSE'} | SSE After-Sales Management System`
  
  // Wait for auth initialization to complete
  if (!authInitialized) {
    await initAuthPromise
  }

  const redirectToDefaultRoute = (userRole: UserRole | string | null | undefined) => {
    const defaultRoute = getDefaultRouteByRole(userRole, isAuthenticated.value)
    if (defaultRoute === to.path) {
      next(false)
      return
    }
    next(defaultRoute)
  }
  
  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/signin')
    return
  }

  // Nếu đã đăng nhập và vào trang signin/signup, redirect về dashboard theo group
  if ((to.path === '/signin' || to.path === '/signup') && isAuthenticated.value) {
    redirectToDefaultRoute(getUserRole.value)
    return
  }

  // Khách hàng dùng route /customer/* cho thống nhất sidebar & URL
  if (isAuthenticated.value && isCustomerRole(getUserRole.value) && to.path === '/warranty-policy') {
    next('/customer/warranty-policy')
    return
  }

  // Kiểm tra quyền truy cập route dựa trên user group và role
  if (to.meta.requiresAuth && isAuthenticated.value) {
    const userRole = getUserRole.value
    
    // Kiểm tra user group
    if (!canAccessRoute(to)) {
      redirectToDefaultRoute(userRole)
      return
    }

    // Kiểm tra permissions
    if (to.meta.requiresPermission) {
      const permission = to.meta.requiresPermission as string
      if (!hasPermission(permission as any)) {
        redirectToDefaultRoute(userRole)
        return
      }
    }
  }

  next()
})
