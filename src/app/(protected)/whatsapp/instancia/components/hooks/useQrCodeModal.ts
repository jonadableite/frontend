// src/app/(protected)/whatsapp/instancia/components/hooks/useQrCodeModal.ts
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { getInstanceQrCode, restartInstance } from "@/actions/instance";

interface QrCodeData {
  base64?: string;
  pairingCode?: string;
}

interface QrModalState {
  open: boolean;
  data?: QrCodeData;
  instanceName: string | null;
}

export function useQrCodeModal() {
  const [qrModal, setQrModal] = useState<QrModalState>({
    open: false,
    instanceName: null,
  });
  const [isLoadingQrCode, setIsLoadingQrCode] = useState(false);
  const [qrCodeAttempt, setQrCodeAttempt] = useState(0);

  const fetchQrCodeWithRetry = useCallback(async (instanceName: string) => {
    setQrModal({ open: true, instanceName, data: undefined });
    setIsLoadingQrCode(true);

    const maxRetries = 10;
    const retryDelay = 3000; // Aumentei para 3 segundos
    let hasTriedRestart = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      setQrCodeAttempt(attempt);

      try {
        const result = await getInstanceQrCode({ instanceName });

        if ("success" in result && result.success) {
          if (result.qrCode || result.pairingCode) {
            setQrModal((prev) => ({
              ...prev,
              data: { base64: result.qrCode, pairingCode: result.pairingCode },
            }));
            setIsLoadingQrCode(false);
            setQrCodeAttempt(0);
            return;
          }
        }

        // Se a instância não está pronta e ainda não tentamos reiniciar
        if (
          "error" in result &&
          result.error?.includes("ainda não está pronta") &&
          !hasTriedRestart &&
          attempt <= 3
        ) {
          console.log(
            `[useQrCodeModal] Tentando reiniciar instância ${instanceName}...`,
          );

          try {
            const restartResult = await restartInstance({ instanceName });
            if ("success" in restartResult && restartResult.success) {
              hasTriedRestart = true;
              console.log(
                `[useQrCodeModal] Instância ${instanceName} reiniciada com sucesso`,
              );
              // Aguarda mais tempo após reiniciar
              await new Promise((resolve) => setTimeout(resolve, 5000));
              continue;
            }
          } catch (restartError) {
            console.error(
              `[useQrCodeModal] Erro ao reiniciar instância:`,
              restartError,
            );
          }
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    setIsLoadingQrCode(false);
    setQrCodeAttempt(0);
    toast.error(
      `Não foi possível carregar o QR Code para ${instanceName}. Tente reiniciar a instância manualmente ou aguarde alguns minutos.`,
    );
    setQrModal({ open: false, instanceName: null });
  }, []);

  const closeQrModal = useCallback(() => {
    setQrModal({ open: false, instanceName: null });
    setQrCodeAttempt(0);
  }, []);

  return {
    qrModal,
    isLoadingQrCode,
    qrCodeAttempt,
    fetchQrCodeWithRetry,
    closeQrModal,
  };
}
