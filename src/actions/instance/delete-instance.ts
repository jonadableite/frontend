// src/actions/instance/delete-instance.ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { instancesTables } from "@/db/schema";
import { auth } from "@/lib/auth";
import { InstanceNameSchema } from "@/lib/validations";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
const GLOBAL_API_KEY = process.env.GLOBAL_API_KEY;

if (!EVOLUTION_API_BASE_URL || !GLOBAL_API_KEY) {
  console.error("EVOLUTION_API_BASE_URL ou GLOBAL_API_KEY não configurados.");
}

type DeleteInstanceInput = z.infer<typeof InstanceNameSchema>;

export async function deleteInstance(input: DeleteInstanceInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  // Validação com Zod
  const validationResult = InstanceNameSchema.safeParse(input);

  if (!validationResult.success) {
    console.error("Erro de validação:", validationResult.error.errors);
    return {
      error: validationResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { instanceName } = validationResult.data;

  // Verificar se a instância pertence ao usuário logado
  const instance = await db.query.instancesTables.findFirst({
    where:
      eq(instancesTables.userId, userId) &&
      eq(instancesTables.instanceName, instanceName),
  });

  if (!instance) {
    console.error(
      `[deleteInstance] Instância ${instanceName} não encontrada para o usuário ${userId}.`,
    );
    return { error: "Instância não encontrada." };
  }

  try {
    console.log(
      `[deleteInstance] Chamando API para deletar instância ${instanceName}...`,
    );

    const apiResponse = await fetch(
      `${EVOLUTION_API_BASE_URL}/instance/delete/${instanceName}`,
      {
        method: "DELETE",
        headers: {
          apikey: GLOBAL_API_KEY!,
        },
      },
    );

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(
        `[deleteInstance] Erro na resposta da API para deletar ${instanceName}:`,
        apiResponse.status,
        errorData,
      );
      return {
        error:
          errorData.message || "Erro ao deletar instância na Evolution API.",
      };
    }

    await db
      .delete(instancesTables)
      .where(eq(instancesTables.instanceId, instance.instanceId));

    revalidatePath("/whatsapp/instancia");

    return { success: `Instância ${instanceName} deletada com sucesso.` };
  } catch (error) {
    console.error(
      `[deleteInstance] Erro inesperado ao deletar instância ${instanceName}:`,
      error,
    );
    return { error: "Ocorreu um erro inesperado ao deletar a instância." };
  }
}
