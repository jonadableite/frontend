// src/app/(protected)/whatsapp/instancia/components/qr-code-modal.tsx
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QrCodeData {
  base64?: string;
  pairingCode?: string;
}

interface QrModalState {
  open: boolean;
  data?: QrCodeData;
  instanceName: string | null;
}

interface QrCodeModalProps {
  qrModal: QrModalState;
  isLoading: boolean;
  currentAttempt: number;
  onClose: () => void;
  onRetry?: () => void;
}

export function QrCodeModal({
  qrModal,
  isLoading,
  currentAttempt,
  onClose,
  onRetry,
}: QrCodeModalProps) {
  return (
    <AnimatePresence>
      {qrModal.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-center">
                  Conectar Instância: {qrModal.instanceName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground">
                      {currentAttempt <= 3
                        ? "Inicializando instância..."
                        : "Aguardando QR Code..."}
                    </p>
                    {currentAttempt > 0 && (
                      <p className="text-muted-foreground text-sm">
                        Tentativa {currentAttempt} de 10
                      </p>
                    )}
                    {currentAttempt <= 3 && (
                      <p className="text-muted-foreground text-xs">
                        Reiniciando instância se necessário...
                      </p>
                    )}
                  </div>
                ) : qrModal.data?.base64 ? (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto w-fit rounded-lg bg-white p-4 shadow-sm">
                      <Image
                        src={qrModal.data.base64}
                        alt="QR Code"
                        width={256}
                        height={256}
                        className="h-64 w-64 object-contain"
                      />
                    </div>
                    <p className="text-muted-foreground">
                      Escaneie com o WhatsApp no seu celular
                    </p>
                  </div>
                ) : qrModal.data?.pairingCode ? (
                  <div className="space-y-4 text-center">
                    <h3 className="font-semibold">Código de Pareamento</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="font-mono text-2xl font-bold tracking-wider">
                        {qrModal.data.pairingCode}
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      Use este código para conectar seu celular
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 py-8 text-center">
                    <p className="text-destructive">
                      Não foi possível carregar o QR Code ou código de
                      pareamento.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      A instância pode ainda estar inicializando. Tente
                      novamente em alguns instantes.
                    </p>
                    {onRetry && (
                      <Button
                        onClick={onRetry}
                        variant="outline"
                        className="w-full"
                      >
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                )}
                <Button
                  onClick={onClose}
                  className="w-full"
                  variant={qrModal.data ? "default" : "secondary"}
                >
                  {qrModal.data ? "Fechar" : "Conectar Depois"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
