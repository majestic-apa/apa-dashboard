import type { User } from '$lib/types';

// Module-level reactive state — safe because auth is a singleton
// This file uses .svelte.ts so Svelte 5 runes compile correctly
let currentUser = $state<User | null>(null);

export const auth = {
  get user() {
    return currentUser;
  },

  get isAuthenticated() {
    return currentUser !== null;
  },

  setUser(user: User | null) {
    currentUser = user;
  },

  hasPermission(permission: string): boolean {
    if (!currentUser) return false;
    return currentUser.permissions.includes('all') || currentUser.permissions.includes(permission);
  },

  canAccess(roles: User['role'][]): boolean {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  },

  // Returns true if the current user's role is at or above the required role in the hierarchy.
  // field < lead < manager < rm < management < super_admin
  hasRole(role: string): boolean {
    if (!currentUser) return false;
    const hierarchy = ['field', 'lead', 'manager', 'rm', 'management', 'super_admin'];
    const userIndex = hierarchy.indexOf(currentUser.role);
    const requiredIndex = hierarchy.indexOf(role);
    if (userIndex === -1 || requiredIndex === -1) return false;
    return userIndex >= requiredIndex;
  }
};

// Utility — format full name
export function fullName(user: User): string {
  return `${user.first_name} ${user.last_name}`;
}

// Utility — format role for display
export function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
