// src/components/proxy-stats.tsx
"use client";

import { useEffect, useState } from "react";

import { getProxyStats } from "@/actions/proxy";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProxyStats {
  total: number;
  used: number;
  available: number;
}

export function ProxyStats() {
  const [stats, setStats] = useState<ProxyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const result = await getProxyStats();

        if (result.success && result.stats) {
          setStats(result.stats);
        } else {
          setError(result.error || "Erro ao carregar estatísticas");
        }
      } catch (err) {
        setError("Erro inesperado ao carregar estatísticas");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas dos Proxies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas dos Proxies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const usagePercentage = stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Estatísticas dos Proxies
          <Badge variant="secondary">
            {usagePercentage}% em uso
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-muted-foreground">
              Total
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.available}
            </div>
            <div className="text-sm text-muted-foreground">
              Disponíveis
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.used}
            </div>
            <div className="text-sm text-muted-foreground">
              Em uso
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}