// src/app/api/user/profile/route.ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { usersTables } from "@/db/schema";
import { auth } from "@/lib/auth";

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  // 'image' agora é opcional e pode ser uma string vazia para limpar a imagem
  image: z.string().optional().or(z.literal("")),
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
    const validatedData = profileUpdateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, image } = validatedData.data;

    await db
      .update(usersTables)
      .set({
        name,
        image: image === "" ? null : image, // Armazena string vazia como null no DB
        updatedAt: new Date(),
      })
      .where(eq(usersTables.id, session.user.id));

    return NextResponse.json({ message: "Perfil atualizado com sucesso." }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}
