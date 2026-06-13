<template>
  <aside
    :class="[
      'fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200',
      {
        'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[90px]': !isExpanded && !isHovered,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="!isExpanded && (isHovered = true)"
    @mouseleave="isHovered = false"
  >
    <div
      :class="[
        'py-8 flex',
        'justify-center',
      ]"
    >
      <router-link to="/" class="flex items-center justify-center">
        <img
          v-if="isExpanded || isHovered || isMobileOpen"
          src="/images/logo/logo.png"
          alt="SGE VietNam"
          class="object-contain h-16 w-auto max-w-[200px]"
        />
        <img
          v-else
          src="/images/logo/logo.png"
          alt="SGE"
          class="object-contain h-12 w-auto"
        />
      </router-link>
    </div>
    <div
      class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar"
    >
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <div v-for="(menuGroup, groupIndex) in filteredMenuGroups" :key="menuGroup.titleKey">
            <h2
              :class="[
                'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                !isExpanded && !isHovered
                  ? 'lg:justify-center'
                  : 'justify-start',
              ]"
            >
              <template v-if="isExpanded || isHovered || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <HorizontalDots v-else />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="(item, index) in menuGroup.items" :key="item.nameKey">
                <button
                  v-if="item.subItems"
                  @click="toggleSubmenu(groupIndex, index)"
                  :class="[
                    'menu-item group w-full',
                    {
                      'menu-item-active': isSubmenuOpen(groupIndex, index),
                      'menu-item-inactive': !isSubmenuOpen(groupIndex, index),
                    },
                    !isExpanded && !isHovered
                      ? 'lg:justify-center'
                      : 'lg:justify-start',
                  ]"
                >
                  <span
                    :class="[
                      isSubmenuOpen(groupIndex, index)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.label }}</span
                  >
                  <ChevronDownIcon
                    v-if="isExpanded || isHovered || isMobileOpen"
                    :class="[
                      'ml-auto w-5 h-5 transition-transform duration-200',
                      {
                        'rotate-180 text-brand-500': isSubmenuOpen(
                          groupIndex,
                          index
                        ),
                      },
                    ]"
                  />
                </button>
                <router-link
                  v-else-if="item.path"
                  :to="item.path"
                  :class="[
                    'menu-item group',
                    {
                      'menu-item-active': isActive(item.path),
                      'menu-item-inactive': !isActive(item.path),
                    },
                  ]"
                >
                  <span
                    :class="[
                      isActive(item.path)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.label }}</span
                  >
                </router-link>
                <transition
                  @enter="startTransition"
                  @after-enter="endTransition"
                  @before-leave="startTransition"
                  @after-leave="endTransition"
                >
                  <div
                    v-show="
                      isSubmenuOpen(groupIndex, index) &&
                      (isExpanded || isHovered || isMobileOpen)
                    "
                  >
                    <ul class="mt-2 space-y-1 ml-9">
                      <li v-for="subItem in item.subItems" :key="subItem.nameKey">
                        <router-link
                          v-if="subItem.path"
                          :to="subItem.path"
                          :class="[
                            'menu-dropdown-item',
                            {
                              'menu-dropdown-item-active': isActive(
                                subItem.path
                              ),
                              'menu-dropdown-item-inactive': !isActive(
                                subItem.path
                              ),
                            },
                          ]"
                        >
                          {{ subItem.label }}
                          <span class="flex items-center gap-1 ml-auto">
                            <span
                              v-if="subItem.new"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              new
                            </span>
                            <span
                              v-if="subItem.pro"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              pro
                            </span>
                          </span>
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <SidebarWidget v-if="isExpanded || isHovered || isMobileOpen" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import {
  DocsIcon,
  GridIcon,
  CalenderIcon,
  UserCircleIcon,
  ChatIcon,
  PieChartIcon,
  ChevronDownIcon,
  HorizontalDots,
  BoxIcon,
  SettingsIcon,
  PageIcon,
} from "../../icons";
import SidebarWidget from "./SidebarWidget.vue";
import BoxCubeIcon from "@/icons/BoxCubeIcon.vue";
import { useSidebar } from "@/composables/useSidebar";
import { useAuth, UserRole, Permission } from "@/composables/useAuth";

type MenuItemDefinition = {
  icon?: Component;
  nameKey: string;
  path?: string;
  subItems?: MenuItemDefinition[];
  requiresPermission?: string;
  excludedRoles?: UserRole[];
  pro?: boolean;
  new?: boolean;
};

type MenuGroupDefinition = {
  titleKey: string;
  items: MenuItemDefinition[];
};

type MenuItemWithLabel = MenuItemDefinition & {
  label: string;
  subItems?: MenuItemWithLabel[];
};

type MenuGroupWithLabel = MenuGroupDefinition & {
  title: string;
  items: MenuItemWithLabel[];
};

const route = useRoute();
const { t } = useI18n();

const { isExpanded, isMobileOpen, isHovered, openSubmenu } = useSidebar();
const { hasPermission: checkPermission, getUserRole } = useAuth();

const MENU_GROUPS: MenuGroupDefinition[] = [
  {
    titleKey: "menu.system",
    items: [
      {
        icon: GridIcon,
        nameKey: "menu.dashboard",
        path: "/",
      },
      {
        icon: CalenderIcon,
        nameKey: "menu.calendar",
        path: "/calendar",
        requiresPermission: "view_schedule",
      },
      {
        icon: PieChartIcon,
        nameKey: "menu.reporting",
        path: "/reports",
        requiresPermission: "view_reports",
      },
    ],
  },
  {
    titleKey: "menu.management",
    items: [
      {
        icon: UserCircleIcon,
        nameKey: "menu.customerManagement",
        path: "/customers",
        requiresPermission: "view_customers",
        excludedRoles: [UserRole.TECHNICIAN, UserRole.WAREHOUSE],
      },
      {
        icon: PageIcon,
        nameKey: "menu.contractManagement",
        path: "/contracts",
        requiresPermission: "view_contracts",
        excludedRoles: [UserRole.TECHNICIAN, UserRole.WAREHOUSE],
      },
      {
        icon: BoxCubeIcon,
        nameKey: "menu.deviceList",
        path: "/inverters",
        requiresPermission: "view_inverters",
      },
      {
        icon: ChatIcon,
        nameKey: "menu.ticketAndWarranty",
        subItems: [
          {
            nameKey: "menu.ticketList",
            path: "/tickets",
            pro: false,
            requiresPermission: "view_tickets",
          },
          {
            nameKey: "menu.ticketCreate",
            path: "/tickets/new",
            pro: false,
            requiresPermission: "create_ticket",
          },
        ],
      },
      {
        icon: DocsIcon,
        nameKey: "menu.warrantyPolicy",
        path: "/warranty-policy",
      },
      {
        icon: SettingsIcon,
        nameKey: "menu.moreSetting",
        excludedRoles: [UserRole.ACCOUNTING],
        subItems: [
          {
            nameKey: "menu.technicianManagement",
            path: "/technicians",
            requiresPermission: "view_technicians",
          },
          {
            nameKey: "menu.userManagement",
            path: "/users",
            requiresPermission: "view_users",
          },
          {
            nameKey: "menu.slaSettings",
            path: "/settings/sla",
            requiresPermission: "manage_roles",
          },
          {
            nameKey: "menu.autoAssignSettings",
            path: "/settings/auto-assign",
            requiresPermission: "manage_roles",
          },
        ],
      },
    ],
  },
  {
    titleKey: "menu.others",
    items: [
      {
        icon: UserCircleIcon,
        nameKey: "menu.profile",
        path: "/profile",
      },
    ],
  },
];

// Transform path based on user role (for customer routes)
const transformPath = (path?: string): string | undefined => {
  if (!path) return path;
  const userRole = getUserRole.value;
  
  // For customer roles (END_USER, DISTRIBUTOR), transform certain paths
  if (userRole === UserRole.END_USER || userRole === UserRole.DISTRIBUTOR) {
    // Transform device list path
    if (path === '/inverters') {
      return '/customer/inverters';
    }
    if (path === '/contracts') {
      return '/customer/contracts';
    }
    // Transform ticket paths
    if (path === '/tickets') {
      return '/customer/tickets';
    }
    if (path === '/tickets/new') {
      return '/customer/tickets/new';
    }
    // Transform dashboard path
    if (path === '/') {
      return '/customer/dashboard';
    }
    // Transform profile path
    if (path === '/profile') {
      return '/customer/profile';
    }
    if (path === '/warranty-policy') {
      return '/customer/warranty-policy';
    }
  }
  
  return path;
};

const translateMenuGroups = computed<MenuGroupWithLabel[]>(() => {
  return MENU_GROUPS.map((group) => ({
    titleKey: group.titleKey,
    title: t(group.titleKey),
    items: group.items.map((item): MenuItemWithLabel => ({
      ...item,
      label: t(item.nameKey),
      path: transformPath(item.path),
      subItems: item.subItems
        ? item.subItems.map((subItem): MenuItemWithLabel => ({
            ...subItem,
            label: t(subItem.nameKey),
            path: transformPath(subItem.path),
            subItems: undefined, // Nested subItems not supported
          }))
        : undefined,
    })),
  }));
});

const filterMenuItems = (items: MenuItemWithLabel[]): MenuItemWithLabel[] => {
  return items
    .map((item) => {
      const userRole = getUserRole.value
      if (item.excludedRoles?.length && userRole && item.excludedRoles.includes(userRole as UserRole)) {
        return null
      }

      // Check permissions first
      if (item.requiresPermission && !checkPermission(item.requiresPermission as Permission)) {
        return null;
      }

      // Process sub-items recursively
      if (item.subItems) {
        const filteredSubItems = filterMenuItems(item.subItems);
        if (filteredSubItems.length === 0) {
          return null;
        }

        return {
          ...item,
          subItems: filteredSubItems,
        };
      }

      return item;
    })
    .filter((item): item is MenuItemWithLabel => Boolean(item));
};

const filteredMenuGroups = computed(() => {
  return translateMenuGroups.value
    .map((group) => ({
      titleKey: group.titleKey,
      title: group.title,
      items: filterMenuItems(group.items),
    }))
    .filter((group) => group.items.length > 0);
});

const isActive = (path?: string) => (!!path && route.path === path);

const toggleSubmenu = (groupIndex: number, itemIndex: number) => {
  const key = `${groupIndex}-${itemIndex}`;
  openSubmenu.value = openSubmenu.value === key ? null : key;
};

const isAnySubmenuRouteActive = computed(() => {
  return filteredMenuGroups.value.some((group) =>
    group.items.some(
      (item) =>
        item.subItems && item.subItems.some((subItem) => (subItem.path ? isActive(subItem.path) : false)),
    ),
  );
});

const isSubmenuOpen = (groupIndex: number, itemIndex: number) => {
  const key = `${groupIndex}-${itemIndex}`;
  const group = filteredMenuGroups.value[groupIndex];
  const item = group?.items[itemIndex];

  if (!item?.subItems) {
    return false;
  }

  return (
    openSubmenu.value === key ||
    (isAnySubmenuRouteActive.value &&
      item.subItems.some((subItem) => (subItem.path ? isActive(subItem.path) : false)))
  );
};

const startTransition = (el: Element, done?: () => void) => {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = "auto";
  const height = htmlEl.scrollHeight;
  htmlEl.style.height = "0px";
  htmlEl.offsetHeight;
  htmlEl.style.height = `${height}px`;
  done?.();
};

const endTransition = (el: Element) => {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = "";
};
</script>
