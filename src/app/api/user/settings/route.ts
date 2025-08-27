// src/app/api/user/settings/route.ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { usersTables } from "@/db/schema";
import { auth } from "@/lib/auth";

const settingsUpdateSchema = z.object({
  timezone: z.string().min(1, "Fuso horário é obrigatório"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  receiveNotifications: z.boolean().default(true),
});

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = settingsUpdateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { timezone, theme, receiveNotifications } = validatedData.data;

    // Busca as configurações atuais para mesclar o JSONB
    const currentUser = await db.query.usersTables.findFirst({
      where: eq(usersTables.id, session.user.id),
      columns: {
        settings: true,
      },
    });

    const currentSettings = (currentUser?.settings || {}) as Record<string, any>;
    const updatedSettings = {
      ...currentSettings,
      theme,
      receiveNotifications,
    };

    await db
      .update(usersTables)
      .set({
        timezone,
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(usersTables.id, session.user.id));

    return NextResponse.json({ message: "Configurações atualizadas com sucesso." }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}
