// src/app/(protected)/whatsapp/instancia/components/instance-list.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Globe,
  Link,
  Loader2,
  LogOut,
  MessageCircle,
  QrCode,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  deleteInstance,
  fetchInstanceDetails,
  logoutInstance,
  restartInstance,
} from "@/actions/instance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { instancesTables } from "@/db/schema";
import { cn } from "@/lib/utils";

import { useQrCodeModal } from "./hooks/useQrCodeModal";
import { QrCodeModal } from "./qr-code-modal";
import { TooltipActionButton } from "./tooltip-action-button";

// Hook de debounce para otimizar a busca
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const InstanceProxyModal = lazy(() =>
  import("./instance-proxy-modal").then((m) => ({
    default: m.InstanceProxyModal,
  })),
);

const InstanceSettingsModal = lazy(() =>
  import("./instance-settings-modal").then((m) => ({
    default: m.InstanceSettingsModal,
  })),
);

export type Instance = typeof instancesTables.$inferSelect;

interface InstanceListProps {
  initialInstances: Instance[];
}

// Reducer de estado de loading para melhor controle
type LoadingState = Record<string, boolean>;
function loadingReducer(
  state: LoadingState,
  action: { type: string; key: string; value: boolean },
) {
  return { ...state, [action.key]: action.value };
}

// Componente de status otimizado e memorizado
const StatusBadge = memo(({ status }: { status: string | null }) => {
  const config = useMemo(() => {
    switch (status) {
      case "open":
      case "online":
        return {
          icon: Wifi,
          text: "Online",
          className:
            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
          pulse: true,
        };
      case "connecting":
      case "start":
        return {
          icon: Activity,
          text: "Conectando",
          className:
            "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400",
          pulse: true,
        };
      case "qrcode":
        return {
          icon: QrCode,
          text: "QR Code",
          className:
            "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400",
          pulse: true,
        };
      case "close":
      case "offline":
        return {
          icon: WifiOff,
          text: "Offline",
          className:
            "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400",
          pulse: false,
        };
      default:
        return {
          icon: AlertCircle,
          text: "Desconhecido",
          className:
            "bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400",
          pulse: false,
        };
    }
  }, [status]);

  const Icon = config.icon;
  return (
    <Badge
      className={cn("flex items-center gap-1.5 px-2 py-1", config.className)}
    >
      <motion.div
        animate={config.pulse ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Icon className="h-3 w-3" />
      </motion.div>
      <span className="text-xs font-medium">{config.text}</span>
    </Badge>
  );
});
StatusBadge.displayName = "StatusBadge";

// Avatar com status memorizado
const InstanceAvatar = memo(({ instance }: { instance: Instance }) => {
  const isOnline = instance.status === "open" || instance.status === "online";
  return (
    <div className="relative">
      <Avatar className="h-12 w-12 border-2 shadow-sm md:h-14 md:w-14">
        <AvatarImage
          src={instance.profilePicUrl || undefined}
          alt={instance.profileName || instance.instanceName}
        />
        <AvatarFallback>
          {instance.profileName?.charAt(0) ||
            instance.instanceName?.charAt(0) || (
              <MessageCircle className="h-5 w-5" />
            )}
        </AvatarFallback>
      </Avatar>
      <motion.div
        className={cn(
          "absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full border-2",
          isOnline ? "bg-emerald-500" : "bg-gray-400",
        )}
        animate={isOnline ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
});
InstanceAvatar.displayName = "InstanceAvatar";

export function InstanceList({ initialInstances }: InstanceListProps) {
  const [instances, setInstances] = useState(initialInstances);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300); // Debounce para a busca
  const [loadingState, dispatchLoading] = useReducer(loadingReducer, {});

  // Hook personalizado para QR Code
  const {
    qrModal,
    isLoadingQrCode,
    qrCodeAttempt,
    fetchQrCodeWithRetry,
    closeQrModal,
  } = useQrCodeModal();

  const [settingsModal, setSettingsModal] = useState<{
    open: boolean;
    instanceName: string;
  }>({ open: false, instanceName: "" });
  const [proxyModal, setProxyModal] = useState<{
    open: boolean;
    instanceName: string;
  }>({ open: false, instanceName: "" });

  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(20); // Carrega 20 inicialmente
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerLoad = 20; // Carrega 20 a mais quando necessário

  const instancesRef = useRef(instances);
  useEffect(() => {
    instancesRef.current = instances;
  }, [instances]);

  const fetchDetails = useCallback(async (instanceName: string) => {
    dispatchLoading({
      type: "set",
      key: `details-${instanceName}`,
      value: true,
    });
    const result = await fetchInstanceDetails({ instanceName });
    dispatchLoading({
      type: "set",
      key: `details-${instanceName}`,
      value: false,
    });

    // Type guard: check if result has success property and it's true
    if ("success" in result && result.success) {
      setInstances((prev) =>
        prev.map((inst) =>
          inst.instanceName === instanceName ? result.instance : inst,
        ),
      );
    } else if ("error" in result) {
      toast.error(result.error || `Erro ao obter detalhes de ${instanceName}`);
    }
  }, []);

  // Batched/throttled updates to prevent server overload
  const updateBatch = useRef<string[]>([]);
  const updateTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const processBatch = useCallback(async () => {
    if (updateBatch.current.length === 0) return;

    const batch = [...updateBatch.current];
    updateBatch.current = [];

    // Process in chunks of 5 to avoid overwhelming the server
    const chunkSize = 5;
    for (let i = 0; i < batch.length; i += chunkSize) {
      const chunk = batch.slice(i, i + chunkSize);

      // Process chunk with 1-second delays between chunks
      await Promise.all(
        chunk.map((instanceName) => fetchDetails(instanceName)),
      );

      if (i + chunkSize < batch.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }, [fetchDetails]);

  const batchedUpdate = useCallback(
    (instanceName: string) => {
      // Clear any existing timeout for this instance
      const existingTimeout = updateTimeouts.current.get(instanceName);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Add to batch if not already present
      if (!updateBatch.current.includes(instanceName)) {
        updateBatch.current.push(instanceName);
      }

      // Schedule batch processing after 2 seconds
      const timeout = setTimeout(() => {
        if (updateBatch.current.length > 0) {
          processBatch();
        }
      }, 2000);

      updateTimeouts.current.set(instanceName, timeout);
    },
    [processBatch],
  );

  // Optimized polling - only visible instances that need updates
  useEffect(() => {
    // Copy ref value to avoid stale closure warning
    const timeoutsMap = updateTimeouts.current;

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        const visibleInstances = instancesRef.current.slice(0, displayedCount);
        visibleInstances.forEach((instance) => {
          if (
            ["connecting", "qrcode", "start", "unknown"].includes(
              instance.status || "",
            )
          ) {
            batchedUpdate(instance.instanceName);
          }
        });
      }
    }, 90000); // A cada 90 segundos

    return () => {
      clearInterval(intervalId);
      // Clear all timeouts on cleanup
      if (timeoutsMap) {
        timeoutsMap.forEach((timeout) => clearTimeout(timeout));
        timeoutsMap.clear();
      }
    };
  }, [batchedUpdate, displayedCount]);

  const filteredInstances = useMemo(
    () =>
      instances.filter(
        (inst) =>
          inst.instanceName
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          inst.profileName
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          inst.ownerJid
            ?.replace("@s.whatsapp.net", "")
            .includes(debouncedSearch),
      ),
    [instances, debouncedSearch],
  );

  // Reset displayed count when search changes
  useEffect(() => {
    setDisplayedCount(20);
  }, [debouncedSearch]);

  // Infinite scroll logic
  const displayedInstances = useMemo(() => {
    return filteredInstances.slice(0, displayedCount);
  }, [filteredInstances, displayedCount]);

  const hasMoreInstances = useMemo(() => {
    return displayedCount < filteredInstances.length;
  }, [displayedCount, filteredInstances.length]);

  const loadMoreInstances = useCallback(async () => {
    if (isLoadingMore || !hasMoreInstances) return;

    setIsLoadingMore(true);

    // Simulate a small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    setDisplayedCount((prev) =>
      Math.min(prev + itemsPerLoad, filteredInstances.length),
    );
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMoreInstances, itemsPerLoad, filteredInstances.length]);

  // Intersection Observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreInstances && !isLoadingMore) {
          loadMoreInstances();
        }
      },
      { threshold: 0.1 },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMoreInstances, isLoadingMore, loadMoreInstances]);

  // Handlers para os modais e ações

  const handleOpenSettings = useCallback((instanceName: string) => {
    setSettingsModal({ open: true, instanceName });
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsModal({ open: false, instanceName: "" });
  }, []);

  const handleOpenProxyModal = useCallback((instanceName: string) => {
    setProxyModal({ open: true, instanceName });
  }, []);

  const handleCloseProxyModal = useCallback(() => {
    setProxyModal({ open: false, instanceName: "" });
  }, []);

  const handleProxySetSuccess = useCallback(() => {
    toast.success("Proxy configurado com sucesso!");
    handleCloseProxyModal();
    // Você pode adicionar um fetchDetails aqui se quiser atualizar o status do proxy na interface
    // if (proxyModal.instanceName) fetchDetails(proxyModal.instanceName);
  }, [handleCloseProxyModal]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Buscar instâncias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {displayedInstances.map((instance) => (
            <motion.div
              key={instance.instanceName}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="flex h-full flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    {instance.instanceName}
                  </CardTitle>
                  <StatusBadge status={instance.status} />
                </CardHeader>
                <CardContent className="flex flex-grow flex-col justify-between">
                  <div className="flex items-center gap-4">
                    <InstanceAvatar instance={instance} />
                    <div className="flex flex-col">
                      <p className="font-semibold">
                        {instance.profileName || "N/A"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {instance.ownerJid?.replace("@s.whatsapp.net", "") ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Botão QR Code quando status é qrcode */}
                    {instance.status === "qrcode" && (
                      <TooltipActionButton
                        onClick={() =>
                          fetchQrCodeWithRetry(instance.instanceName)
                        }
                        isLoading={
                          isLoadingQrCode &&
                          qrModal.instanceName === instance.instanceName
                        }
                        tooltip="Ver QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </TooltipActionButton>
                    )}

                    {/* Botão Conectar quando instância não está online */}
                    {[
                      "close",
                      "offline",
                      "unknown",
                      "connecting",
                      "start",
                    ].includes(instance.status || "") && (
                      <TooltipActionButton
                        onClick={() =>
                          fetchQrCodeWithRetry(instance.instanceName)
                        }
                        isLoading={
                          isLoadingQrCode &&
                          qrModal.instanceName === instance.instanceName
                        }
                        tooltip="Conectar Instância"
                        className="border-green-600 bg-green-600 text-white hover:bg-green-700 dark:border-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      >
                        <Link className="h-4 w-4" />
                      </TooltipActionButton>
                    )}

                    {/* Botão Logout quando status é open/online */}
                    {["open", "online"].includes(instance.status || "") && (
                      <TooltipActionButton
                        onClick={async () => {
                          dispatchLoading({
                            type: "set",
                            key: `logout-${instance.instanceName}`,
                            value: true,
                          });
                          const result = await logoutInstance({
                            instanceName: instance.instanceName,
                          });
                          dispatchLoading({
                            type: "set",
                            key: `logout-${instance.instanceName}`,
                            value: false,
                          });
                          // Type guard for logout response
                          if ("success" in result && result.success) {
                            toast.success(
                              `Instância ${instance.instanceName} desconectada.`,
                            );
                            fetchDetails(instance.instanceName);
                          } else if ("error" in result) {
                            toast.error(
                              result.error ||
                                "Erro ao desconectar instância. Tente novamente.",
                            );
                          }
                        }}
                        isLoading={
                          loadingState[`logout-${instance.instanceName}`]
                        }
                        tooltip="Desconectar"
                      >
                        <LogOut className="h-4 w-4" />
                      </TooltipActionButton>
                    )}
                    <TooltipActionButton
                      onClick={async () => {
                        dispatchLoading({
                          type: "set",
                          key: `restart-${instance.instanceName}`,
                          value: true,
                        });
                        const result = await restartInstance({
                          instanceName: instance.instanceName,
                        });
                        dispatchLoading({
                          type: "set",
                          key: `restart-${instance.instanceName}`,
                          value: false,
                        });
                        if ("success" in result && result.success) {
                          toast.success(
                            `Instância ${instance.instanceName} reiniciada.`,
                          );
                          fetchDetails(instance.instanceName);
                        } else if ("error" in result) {
                          toast.error(
                            result.error ||
                              "Erro ao reiniciar instância. Tente novamente.",
                          );
                        }
                      }}
                      isLoading={
                        loadingState[`restart-${instance.instanceName}`]
                      }
                      tooltip="Reiniciar"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </TooltipActionButton>
                    {/* Novo Botão de Proxy */}
                    <TooltipActionButton
                      onClick={() =>
                        handleOpenProxyModal(instance.instanceName)
                      }
                      tooltip="Configurar Proxy"
                    >
                      <Globe className="h-4 w-4" />
                    </TooltipActionButton>
                    <TooltipActionButton
                      onClick={() => handleOpenSettings(instance.instanceName)}
                      tooltip="Configurações"
                    >
                      <Settings className="h-4 w-4" />
                    </TooltipActionButton>
                    <TooltipActionButton
                      onClick={async () => {
                        if (
                          !confirm(
                            `Tem certeza que deseja deletar a instância ${instance.instanceName}? Esta ação é irreversível.`,
                          )
                        ) {
                          return;
                        }
                        dispatchLoading({
                          type: "set",
                          key: `delete-${instance.instanceName}`,
                          value: true,
                        });
                        const result = await deleteInstance({
                          instanceName: instance.instanceName,
                        });
                        dispatchLoading({
                          type: "set",
                          key: `delete-${instance.instanceName}`,
                          value: false,
                        });
                        if ("success" in result && result.success) {
                          toast.success(
                            `Instância ${instance.instanceName} deletada.`,
                          );
                          setInstances((prev) =>
                            prev.filter(
                              (inst) =>
                                inst.instanceName !== instance.instanceName,
                            ),
                          );
                        } else if ("error" in result) {
                          toast.error(
                            result.error ||
                              "Erro ao deletar instância. Tente novamente.",
                          );
                        }
                      }}
                      isLoading={
                        loadingState[`delete-${instance.instanceName}`]
                      }
                      variant="destructive"
                      tooltip="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </TooltipActionButton>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Infinite Scroll Loading */}
      {hasMoreInstances && (
        <div
          ref={loadMoreRef}
          className="mt-8 flex items-center justify-center gap-4 py-8"
        >
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Carregando mais instâncias...
              </span>
            </div>
          ) : (
            <Button
              onClick={loadMoreInstances}
              variant="outline"
              className="px-8"
            >
              Carregar mais ({filteredInstances.length - displayedCount}{" "}
              restantes)
            </Button>
          )}
        </div>
      )}

      {/* Results info */}
      <div className="text-muted-foreground text-center text-sm">
        Exibindo {displayedInstances.length} de {filteredInstances.length}{" "}
        instâncias
        {debouncedSearch && (
          <span> (filtradas de {instances.length} no total)</span>
        )}
      </div>

      {/* Modal do QR Code */}
      <QrCodeModal
        qrModal={qrModal}
        isLoading={isLoadingQrCode}
        currentAttempt={qrCodeAttempt}
        onClose={closeQrModal}
        onRetry={() =>
          qrModal.instanceName && fetchQrCodeWithRetry(qrModal.instanceName)
        }
      />

      {/* Modal de Configurações da Instância */}
      <Suspense fallback={null}>
        {settingsModal.open && (
          <InstanceSettingsModal
            isOpen={settingsModal.open}
            onClose={handleCloseSettings}
            instanceName={settingsModal.instanceName}
          />
        )}
      </Suspense>

      {/* Novo Modal de Proxy da Instância */}
      <Suspense fallback={null}>
        {proxyModal.open && (
          <InstanceProxyModal
            isOpen={proxyModal.open}
            onClose={handleCloseProxyModal}
            instanceName={proxyModal.instanceName}
            onProxySetSuccess={handleProxySetSuccess}
          />
        )}
      </Suspense>
    </div>
  );
}
