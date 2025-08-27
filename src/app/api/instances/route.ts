// src/app/api/instances/route.ts
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Buscar todas as instâncias do usuário
    const instances = await db.query.instancesTables.findMany({
      where: eq(instancesTables.userId, userId),
      orderBy: (instances, { desc }) => [desc(instances.createdAt)],
    });

    console.log(`Found ${instances.length} instances for user ${userId}`);

    return NextResponse.json({
      success: true,
      instances: instances.map(instance => ({
        instanceId: instance.instanceId,
        instanceName: instance.instanceName,
        status: instance.status,
        profileName: instance.profileName,
        phoneNumber: instance.ownerJid?.replace("@s.whatsapp.net", ""),
        ownerJid: instance.ownerJid,
      })),
      total: instances.length,
    });

  } catch (error) {
    console.error("Erro ao buscar instâncias:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
