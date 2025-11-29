/**
 * Property-based test for RBAC enforcement
 * Feature: hackathon-aws-demo, Property 8: Role-based access control
 * Validates: Requirements 4.5
 * 
 * Property: For any user attempting to access a resource, the system should 
 * only allow access if the user's Cognito group has the required permissions
 */

import * as fc from 'fast-check';
import { 
  Role, 
  Permission, 
  hasPermission, 
  getPermissionsForRole,
  requirePermission 
} from '../auth/rbac';
import { AuthenticatedUser } from '../auth/middleware';

describe('Property 8: Role-based access control', () => {
  // Feature: hackathon-aws-demo, Property 8: Role-based access control
  it('should only grant access when user role has required permission', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random role and permission combinations
        fc.constantFrom(...Object.values(Role)),
        fc.constantFrom(...Object.values(Permission)),
        async (role, permission) => {
          // Create user with the generated role
          const user: AuthenticatedUser = {
            username: 'test-user',
            sub: 'test-sub-123',
            email: 'test@example.com',
            role: role,
            groups: [role]
          };

          // Get expected permissions for this role
          const rolePermissions = getPermissionsForRole(role);
          const shouldHaveAccess = rolePermissions.includes(permission);

          // Check if user has permission
          const actualHasAccess = hasPermission(user, permission);

          // Property: Access granted if and only if role has permission
          expect(actualHasAccess).toBe(shouldHaveAccess);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce permission requirements consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.values(Role)),
        fc.constantFrom(...Object.values(Permission)),
        async (role, permission) => {
          const user: AuthenticatedUser = {
            username: 'test-user',
            sub: 'test-sub-456',
            email: 'test@example.com',
            role: role
          };

          const rolePermissions = getPermissionsForRole(role);
          const shouldHavePermission = rolePermissions.includes(permission);

          if (shouldHavePermission) {
            // Should not throw
            expect(() => requirePermission(user, permission)).not.toThrow();
          } else {
            // Should throw error
            expect(() => requirePermission(user, permission)).toThrow(/Insufficient permissions/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deny access to viewers for write operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          Permission.MODIFY_DIGITAL_TWIN,
          Permission.CREATE_SCENARIO,
          Permission.MODIFY_SCENARIO,
          Permission.DELETE_SCENARIO,
          Permission.ACKNOWLEDGE_ALERTS,
          Permission.CONFIGURE_ALERTS,
          Permission.MANAGE_USERS,
          Permission.CONFIGURE_SYSTEM
        ),
        async (writePermission) => {
          const viewerUser: AuthenticatedUser = {
            username: 'viewer-user',
            sub: 'viewer-sub',
            email: 'viewer@example.com',
            role: Role.VIEWER
          };

          // Property: Viewers should never have write permissions
          const hasAccess = hasPermission(viewerUser, writePermission);
          expect(hasAccess).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should grant all permissions to admin role', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.values(Permission)),
        async (permission) => {
          const adminUser: AuthenticatedUser = {
            username: 'admin-user',
            sub: 'admin-sub',
            email: 'admin@example.com',
            role: Role.ADMIN
          };

          // Property: Admins should have all permissions
          const hasAccess = hasPermission(adminUser, permission);
          expect(hasAccess).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle users with group-based permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.values(Role)),
        fc.constantFrom(...Object.values(Permission)),
        async (role, permission) => {
          // User with no explicit role but has group
          const user: AuthenticatedUser = {
            username: 'group-user',
            sub: 'group-sub',
            email: 'group@example.com',
            groups: [role]
          };

          const rolePermissions = getPermissionsForRole(role);
          const shouldHaveAccess = rolePermissions.includes(permission);

          // Property: Group-based permissions work same as role-based
          const actualHasAccess = hasPermission(user, permission);
          expect(actualHasAccess).toBe(shouldHaveAccess);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deny access when user has no role or groups', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.values(Permission)),
        async (permission) => {
          const userWithoutRole: AuthenticatedUser = {
            username: 'no-role-user',
            sub: 'no-role-sub',
            email: 'norole@example.com'
          };

          // Property: Users without role/groups have no permissions
          const hasAccess = hasPermission(userWithoutRole, permission);
          expect(hasAccess).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain permission hierarchy across roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.values(Permission)),
        async (permission) => {
          const roles = [
            Role.ADMIN,
            Role.SUPPLY_CHAIN_DIRECTOR,
            Role.OPERATIONS_MANAGER,
            Role.SUSTAINABILITY_OFFICER,
            Role.ANALYST,
            Role.VIEWER
          ];

          const permissionCounts = roles.map(role => {
            const user: AuthenticatedUser = {
              username: 'test',
              sub: 'test',
              role: role
            };
            return hasPermission(user, permission) ? 1 : 0;
          });

          // Property: Admin should have at least as many permissions as any other role
          const adminHasPermission = permissionCounts[0] === 1;
          const anyOtherRoleHasPermission = permissionCounts.slice(1).some(count => count === 1);

          if (anyOtherRoleHasPermission) {
            expect(adminHasPermission).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should consistently enforce read-only permissions for viewers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          Permission.VIEW_DIGITAL_TWIN,
          Permission.VIEW_SCENARIO,
          Permission.VIEW_ALERTS,
          Permission.VIEW_MARKETPLACE,
          Permission.VIEW_SUSTAINABILITY
        ),
        async (viewPermission) => {
          const viewerUser: AuthenticatedUser = {
            username: 'viewer',
            sub: 'viewer-sub',
            role: Role.VIEWER
          };

          // Property: Viewers should have all view permissions
          const hasAccess = hasPermission(viewerUser, viewPermission);
          expect(hasAccess).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
