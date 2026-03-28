import { z } from "zod";
import { adminProcedure, router, superAdminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, adminRolePermissions } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

const ROLE_DEFAULTS: Record<string, Partial<typeof adminRolePermissions.$inferInsert>> = {
  superadmin: {
    canApproveKyc: 1,
    canPublishListings: 1,
    canManageUsers: 1,
    canManagePayments: 1,
    canManageCrypto: 1,
    canManageAiAgents: 1,
    canManageCategories: 1,
    canViewAnalytics: 1,
    canViewDealPipeline: 1,
    canContactUsers: 1,
    canManageAdmins: 1,
  },
  admin: {
    canApproveKyc: 1,
    canPublishListings: 1,
    canManageUsers: 1,
    canManagePayments: 0,
    canManageCrypto: 0,
    canManageAiAgents: 0,
    canManageCategories: 1,
    canViewAnalytics: 1,
    canViewDealPipeline: 1,
    canContactUsers: 1,
    canManageAdmins: 0,
  },
  sales: {
    canApproveKyc: 0,
    canPublishListings: 0,
    canManageUsers: 0,
    canManagePayments: 0,
    canManageCrypto: 0,
    canManageAiAgents: 0,
    canManageCategories: 0,
    canViewAnalytics: 1,
    canViewDealPipeline: 1,
    canContactUsers: 1,
    canManageAdmins: 0,
  },
  support: {
    canApproveKyc: 0,
    canPublishListings: 0,
    canManageUsers: 0,
    canManagePayments: 0,
    canManageCrypto: 0,
    canManageAiAgents: 0,
    canManageCategories: 0,
    canViewAnalytics: 0,
    canViewDealPipeline: 1,
    canContactUsers: 1,
    canManageAdmins: 0,
  },
};

export const adminRolesRouter = router({
  /** Admin: list all staff members (all non-user roles) */
  listStaff: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(
        inArray(users.role, ['admin', 'superadmin', 'sales', 'support']),
      );
  }),

  /** Superadmin: promote a user to a staff role */
  setRole: superAdminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin', 'superadmin', 'sales', 'support', 'suspended']),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      // Upsert default permissions for the new role
      if (input.role in ROLE_DEFAULTS) {
        const defaults = ROLE_DEFAULTS[input.role];
        const existing = await db
          .select({ id: adminRolePermissions.id })
          .from(adminRolePermissions)
          .where(eq(adminRolePermissions.userId, input.userId))
          .limit(1);

        if (existing.length) {
          await db
            .update(adminRolePermissions)
            .set({ ...defaults, notes: input.notes ?? null, grantedBy: ctx.user.id })
            .where(eq(adminRolePermissions.userId, input.userId));
        } else {
          await db.insert(adminRolePermissions).values({
            userId: input.userId,
            ...defaults,
            notes: input.notes ?? null,
            grantedBy: ctx.user.id,
          } as typeof adminRolePermissions.$inferInsert);
        }
      }

      return { success: true };
    }),

  /** Superadmin: update fine-grained permissions for a staff member */
  updatePermissions: superAdminProcedure
    .input(
      z.object({
        userId: z.number(),
        canApproveKyc: z.boolean().optional(),
        canPublishListings: z.boolean().optional(),
        canManageUsers: z.boolean().optional(),
        canManagePayments: z.boolean().optional(),
        canManageCrypto: z.boolean().optional(),
        canManageAiAgents: z.boolean().optional(),
        canManageCategories: z.boolean().optional(),
        canViewAnalytics: z.boolean().optional(),
        canViewDealPipeline: z.boolean().optional(),
        canContactUsers: z.boolean().optional(),
        canManageAdmins: z.boolean().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { userId, notes, ...booleans } = input;

      const setValues: Record<string, unknown> = { grantedBy: ctx.user.id };
      if (notes !== undefined) setValues.notes = notes;
      for (const [key, val] of Object.entries(booleans)) {
        if (val !== undefined) setValues[key] = val ? 1 : 0;
      }

      const existing = await db
        .select({ id: adminRolePermissions.id })
        .from(adminRolePermissions)
        .where(eq(adminRolePermissions.userId, userId))
        .limit(1);

      if (existing.length) {
        await db
          .update(adminRolePermissions)
          .set(setValues)
          .where(eq(adminRolePermissions.userId, userId));
      } else {
        await db.insert(adminRolePermissions).values({
          userId,
          ...setValues,
        } as typeof adminRolePermissions.$inferInsert);
      }

      return { success: true };
    }),

  /** Admin: get permissions for a specific user */
  getPermissions: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db
        .select()
        .from(adminRolePermissions)
        .where(eq(adminRolePermissions.userId, input.userId))
        .limit(1);

      return rows[0] ?? null;
    }),
});
