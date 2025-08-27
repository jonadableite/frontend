// src/app/(protected)/conta/_components/PlanInfo.tsx
"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { User } from "@/db/schema";

interface PlanInfoProps {
  user: User;
}

const PlanInfo: React.FC<PlanInfoProps> = ({ user }) => {
  const planDisplayName = user.plan === "FREE" ? "Gratuito" : user.plan;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Plano Atual</p>
        <Badge className="mt-1" variant="secondary">{planDisplayName}</Badge>
        {user.stripeSubscriptionId && (
          <p className="text-sm text-muted-foreground mt-2">
            ID da Assinatura: <span className="font-mono text-xs">{user.stripeSubscriptionId}</span>
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium">Limites de Mensagens</p>
        <p className="text-muted-foreground text-sm mt-1">
          Diário: <span className="font-semibold">{user.dailyMessageLimit || "N/A"}</span> mensagens
        </p>
        <p className="text-muted-foreground text-sm">
          Mensal: <span className="font-semibold">{user.monthlyMessageLimit || "N/A"}</span> mensagens
        </p>
      </div>

      {user.stripeCustomerId && (
        <div>
          <p className="text-sm font-medium">Gerenciar Assinatura</p>
          <CardDescription className="mt-1">
            Acesse o portal do cliente para atualizar seu plano ou informações de pagamento.
          </CardDescription>
          <Button asChild className="mt-2">
            <Link href="/billing-portal" target="_blank" rel="noopener noreferrer">
              Ir para o Portal de Faturamento
            </Link>
          </Button>
        </div>
      )}

      {!user.stripeCustomerId && user.plan === "FREE" && (
        <div>
          <p className="text-sm font-medium">Atualizar Plano</p>
          <CardDescription className="mt-1">
            Explore nossos planos pagos para obter mais recursos e limites.
          </CardDescription>
          <Button asChild className="mt-2">
            <Link href="/pricing">
              Ver Planos
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlanInfo;
