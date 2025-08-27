// src/actions/user/index.ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { db } from "@/db";
import { User, usersTables } from "@/db/schema";
import { auth } from "@/lib/auth";

interface UpdateAccountState {
  message: string;
  success: boolean;
  errors?: string;
}

export async function updateAccountSettings(
  prevState: UpdateAccountState,
  formData: FormData
): Promise<UpdateAccountState> {
  try {
    const name = formData.get("name") as string;
    const image = formData.get("image") as string;
    const timezone = formData.get("timezone") as string;

    const currentUser = await auth.api.getSession({ headers: new Headers() });
    if (!currentUser) {
      return { message: "Usuário não autenticado.", success: false };
    }

    const updateFields: Partial<User> = {};

    if (name !== undefined && name !== currentUser.user.name) {
      updateFields.name = name;
    }
    if (image !== undefined && image !== currentUser.user.image) {
      updateFields.image = image;
    }
    if (timezone !== undefined && timezone !== currentUser.user.timezone) {
      updateFields.timezone = timezone;
    }

    if (Object.keys(updateFields).length === 0) {
      return { message: "Nenhuma alteração para salvar.", success: true };
    }

    await db
      .update(usersTables)
      .set({
        ...updateFields,
        updatedAt: new Date(),
      })
      .where(eq(usersTables.id, currentUser.user.id));

    revalidatePath("/conta");

    return { message: "Configurações atualizadas com sucesso!", success: true };
  } catch (error: unknown) {
    console.error("Falha ao atualizar configurações da conta:", error);
    let errorMessage = "Erro desconhecido.";
    let validationErrors: string | undefined;

    if (error instanceof ZodError) {
      errorMessage = "Falha na validação dos dados.";
      validationErrors = error.errors.map(err => err.message).join(", ");
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      message: `Falha ao atualizar configurações: ${errorMessage}`,
      success: false,
      errors: validationErrors,
    };
  }
}
