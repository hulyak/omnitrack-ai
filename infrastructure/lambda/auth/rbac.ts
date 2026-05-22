import { AuthenticatedUser } from './middleware';

/**
 * Role definitions for the OmniTrack AI system
 */
export enum Role {
  ADMIN = 'admin',
  SUPPLY_CHAIN_DIRECTOR = 'supply_chain_director',
  OPERATIONS_MANAGER = 'operations_manager',
  SUSTAINABILITY_OFFICER = 'sustainability_officer',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

/**
 * Permission definitions for the OmniTrack AI system
 */
export enum Permission {
  // User management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',

  // Digital twin
  VIEW_DIGITAL_TWIN = 'view_digital_twin',
  MODIFY_DIGITAL_TWIN = 'modify_digital_twin',

  // Scenarios
  CREATE_SCENARIO = 'create_scenario',
  VIEW_SCENARIO = 'view_scenario',
  MODIFY_SCENARIO = 'modify_scenario',
  DELETE_SCENARIO = 'delete_scenario',
  PUBLISH_SCENARIO = 'publish_scenario',

  // Alerts
  VIEW_ALERTS = 'view_alerts',
  ACKNOWLEDGE_ALERTS = 'acknowledge_alerts',
  CONFIGURE_ALERTS = 'configure_alerts',

  // Marketplace
  VIEW_MARKETPLACE = 'view_marketplace',
  RATE_SCENARIOS = 'rate_scenarios',
  FORK_SCENARIOS = 'fork_scenarios',

  // Sustainability
  VIEW_SUSTAINABILITY = 'view_sustainability',
  CONFIGURE_SUSTAINABILITY = 'configure_sustainability',

  // Learning
  PROVIDE_FEEDBACK = 'provide_feedback',
  VIEW_MODEL_METRICS = 'view_model_metrics',
  TRIGGER_RETRAINING = 'trigger_retraining',

  // System
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  CONFIGURE_SYSTEM = 'configure_system',
}

/**
 * Role-to-permissions mapping
 */
const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // Admins have all permissions
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.VIEW_DIGITAL_TWIN,
    Permission.MODIFY_DIGITAL_TWIN,
    Permission.CREATE_SCENARIO,
    Permission.VIEW_SCENARIO,
    Permission.MODIFY_SCENARIO,
    Permission.DELETE_SCENARIO,
    Permission.PUBLISH_SCENARIO,
    Permission.VIEW_ALERTS,
    Permission.ACKNOWLEDGE_ALERTS,
    Permission.CONFIGURE_ALERTS,
    Permission.VIEW_MARKETPLACE,
    Permission.RATE_SCENARIOS,
    Permission.FORK_SCENARIOS,
    Permission.VIEW_SUSTAINABILITY,
    Permission.CONFIGURE_SUSTAINABILITY,
    Permission.PROVIDE_FEEDBACK,
    Permission.VIEW_MODEL_METRICS,
    Permission.TRIGGER_RETRAINING,
    Permission.VIEW_AUDIT_LOGS,
    Permission.CONFIGURE_SYSTEM,
  ],
  [Role.SUPPLY_CHAIN_DIRECTOR]: [
    Permission.VIEW_USERS,
    Permission.VIEW_DIGITAL_TWIN,
    Permission.MODIFY_DIGITAL_TWIN,
    Permission.CREATE_SCENARIO,
    Permission.VIEW_SCENARIO,
    Permission.MODIFY_SCENARIO,
    Permission.DELETE_SCENARIO,
    Permission.PUBLISH_SCENARIO,
    Permission.VIEW_ALERTS,
    Permission.ACKNOWLEDGE_ALERTS,
    Permission.CONFIGURE_ALERTS,
    Permission.VIEW_MARKETPLACE,
    Permission.RATE_SCENARIOS,
    Permission.FORK_SCENARIOS,
    Permission.VIEW_SUSTAINABILITY,
    Permission.CONFIGURE_SUSTAINABILITY,
    Permission.PROVIDE_FEEDBACK,
    Permission.VIEW_MODEL_METRICS,
    Permission.VIEW_AUDIT_LOGS,
  ],
  [Role.OPERATIONS_MANAGER]: [
    Permission.VIEW_DIGITAL_TWIN,
    Permission.CREATE_SCENARIO,
    Permission.VIEW_SCENARIO,
    Permission.MODIFY_SCENARIO,
    Permission.VIEW_ALERTS,
    Permission.ACKNOWLEDGE_ALERTS,
    Permission.VIEW_MARKETPLACE,
    Permission.RATE_SCENARIOS,
    Permission.FORK_SCENARIOS,
    Permission.VIEW_SUSTAINABILITY,
    Permission.PROVIDE_FEEDBACK,
  ],
  [Role.SUSTAINABILITY_OFFICER]: [
    Permission.VIEW_DIGITAL_TWIN,
    Permission.VIEW_SCENARIO,
    Permission.CREATE_SCENARIO,
    Permission.VIEW_ALERTS,
    Permission.VIEW_MARKETPLACE,
    Permission.RATE_SCENARIOS,
    Permission.VIEW_SUSTAINABILITY,
    Permission.CONFIGURE_SUSTAINABILITY,
    Permission.PROVIDE_FEEDBACK,
  ],
  [Role.ANALYST]: [
    Permission.VIEW_DIGITAL_TWIN,
    Permission.VIEW_SCENARIO,
    Permission.CREATE_SCENARIO,
    Permission.VIEW_ALERTS,
    Permission.VIEW_MARKETPLACE,
    Permission.RATE_SCENARIOS,
    Permission.VIEW_SUSTAINABILITY,
    Permission.PROVIDE_FEEDBACK,
    Permission.VIEW_MODEL_METRICS,
  ],
  [Role.VIEWER]: [
    Permission.VIEW_DIGITAL_TWIN,
    Permission.VIEW_SCENARIO,
    Permission.VIEW_ALERTS,
    Permission.VIEW_MARKETPLACE,
    Permission.VIEW_SUSTAINABILITY,
  ],
};

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: AuthenticatedUser,
  permission: Permission
): boolean {
  // Check if user has role
  if (!user.role) {
    // If no role specified, check groups
    if (user.groups && user.groups.length > 0) {
      // Check if any group has the permission
      return user.groups.some((group) => {
        const role = group as Role;
        const permissions = getPermissionsForRole(role);
        return permissions.includes(permission);
      });
    }
    return false;
  }

  const role = user.role as Role;
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: AuthenticatedUser,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  user: AuthenticatedUser,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Require specific permission - throws error if user doesn't have it
 */
export function requirePermission(
  user: AuthenticatedUser,
  permission: Permission
): void {
  if (!hasPermission(user, permission)) {
    throw new Error(
      `Insufficient permissions. Required: ${permission}`
    );
  }
}

/**
 * Require any of the specified permissions - throws error if user doesn't have any
 */
export function requireAnyPermission(
  user: AuthenticatedUser,
  permissions: Permission[]
): void {
  if (!hasAnyPermission(user, permissions)) {
    throw new Error(
      `Insufficient permissions. Required one of: ${permissions.join(', ')}`
    );
  }
}

/**
 * Require all of the specified permissions - throws error if user doesn't have all
 */
export function requireAllPermissions(
  user: AuthenticatedUser,
  permissions: Permission[]
): void {
  if (!hasAllPermissions(user, permissions)) {
    throw new Error(
      `Insufficient permissions. Required all of: ${permissions.join(', ')}`
    );
  }
}
