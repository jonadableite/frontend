import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";

import { DashboardContent } from "./_components/dashboard-content";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";
import { DatePicker } from "./_components/date-picker";
import { TypewriterWelcomeMessage } from "./_components/typewriter-welcome-message"; // Importe o novo componente

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  // Obtenha o nome do usuário ou email para passar para o componente de digitação
  const userName = session.user.name || session.user.email;

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {/* Use o componente TypewriterWelcomeMessage aqui */}
          <TypewriterWelcomeMessage userName={userName} />
        </div>
        <div className="flex items-center gap-4">
          <DatePicker />
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}
