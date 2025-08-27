//src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { usersTables } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: false,
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => {
        return {
          name: profile.name,
          image: profile.picture,
        };
      },
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const userData = await db.query.usersTables.findFirst({
        where: eq(usersTables.id, user.id),
        with: {
          accounts: true,
          instances: true,
        },
      });
      const firstAccount = userData?.accounts?.[0];
      const aggregatedTypeMessagesSent: schema.MessageTypeCounts = {};
      if (userData?.instances) {
        for (const instance of userData.instances) {
          const instanceCounts =
            instance.typeMessagesSent as schema.MessageTypeCounts;
          for (const key in instanceCounts) {
            if (Object.prototype.hasOwnProperty.call(instanceCounts, key)) {
              const messageType = key as keyof schema.MessageTypeCounts;
              aggregatedTypeMessagesSent[messageType] =
                (aggregatedTypeMessagesSent[messageType] || 0) +
                (instanceCounts[messageType] || 0);
            }
          }
        }
      }
      return {
        user: {
          ...user,
          plan: userData?.plan,
          role: userData?.role,
          banned: userData?.banned,
          banReason: userData?.banReason,
          banExpires: userData?.banExpires,
          emailVerified: userData?.emailVerified,
          settings: userData?.settings,
          timezone: userData?.timezone,
          instanceLimits: userData?.instanceLimits,
          instanceTotal: userData?.instanceTotal,
          dailyMessageLimit: userData?.dailyMessageLimit,
          monthlyMessageLimit: userData?.monthlyMessageLimit,
          createdAt: userData?.createdAt,
          updatedAt: userData?.updatedAt,
          stripeCustomerId: userData?.stripeCustomerId,
          stripeSubscriptionId: userData?.stripeSubscriptionId,
          isActive: userData?.isActive,
          lastLoginAt: userData?.lastLoginAt,
          deletedAt: userData?.deletedAt,
          typeMessagesSent: aggregatedTypeMessagesSent,
          account: firstAccount
            ? {
                id: firstAccount.accountId,
                providerId: firstAccount.providerId,
              }
            : undefined,
        },
        session,
      };
    }),
    admin({
      adminRoles: ["admin", "superadmin"],
      defaultRole: "user",
    }),
  ],
  user: {
    modelName: "usersTables",
    additionalFields: {
      stripeCustomerId: {
        type: "string",
        fieldName: "stripeCustomerId",
        required: false,
      },
      stripeSubscriptionId: {
        type: "string",
        fieldName: "stripeSubscriptionId",
        required: false,
      },
      plan: {
        type: "string",
        fieldName: "plan",
        required: false,
      },
    },
  },
  session: {
    modelName: "sessionsTables",
  },
  account: {
    modelName: "accountsTables",
  },
  verification: {
    modelName: "verificationsTables",
  },
  emailAndPassword: {
    enabled: true,
  },
});
