// src/app/(protected)/whatsapp/instancia/page.tsx
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { instancesTables, usersTables } from "@/db/schema";
import { auth } from "@/lib/auth";

import { WhatsappClientPage } from "../instancia/components/whatsapp-client-page";

export default async function WhatsappPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  // 1. Busque os detalhes do usuário (plano e limites)
  const user = await db.query.usersTables.findFirst({
    where: eq(usersTables.id, userId),
    columns: {
      plan: true, // Nome do plano (ex: FREE, PRO)
      instanceLimits: true, // Limite máximo de instâncias
      // trialEndDate: true, // Adicione se você tiver campo de data de fim de teste
    },
  });

  if (!user) {
    // Redirecionar ou mostrar erro se o usuário não for encontrado
    redirect("/authentication");
  }

  // 2. Busque as instâncias do usuário para contar as instâncias atuais
  const userInstances = await db.query.instancesTables.findMany({
    where: eq(instancesTables.userId, userId),
    orderBy: instancesTables.createdAt,
  });

  // 3. Calcule a quantidade de instâncias atuais
  const currentInstancesCount = userInstances.length;

  return (
    <WhatsappClientPage
      initialInstances={userInstances as any}
      userPlan={user.plan}
      instanceLimit={user.instanceLimits}
      currentInstancesCount={currentInstancesCount}
    />
  );
}
