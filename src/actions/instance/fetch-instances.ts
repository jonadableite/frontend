// src/actions/instance/fetch-instances.ts
"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function fetchInstances() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  try {
    console.log(
      `[fetchInstances] Buscando instâncias para o usuário ${userId}...`,
    );

    const userInstances = await db.query.instancesTables.findMany({
      where: eq(instancesTables.userId, userId),
    });

    console.log(
      `[fetchInstances] Encontradas ${userInstances.length} instâncias.`,
    );

    return { success: true, instances: userInstances };
  } catch (error) {
    console.error("Erro inesperado ao buscar instâncias:", error);
    return { error: "Ocorreu um erro inesperado ao buscar as instâncias." };
  }
}
