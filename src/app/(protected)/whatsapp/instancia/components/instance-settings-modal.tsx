// src/app/(protected)/whatsapp/components/instance-settings-modal.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { fetchInstanceSettings, updateInstanceSettings } from "@/actions/instance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const settingsFormSchema = z.object({
  rejectCall: z.boolean(),
  groupsIgnore: z.boolean(),
  alwaysOnline: z.boolean(),
  readMessages: z.boolean(),
  syncFullHistory: z.boolean(),
  readStatus: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface InstanceSettingsModalProps {
  instanceName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InstanceSettingsModal({
  instanceName,
  isOpen,
  onClose,
}: InstanceSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      rejectCall: false,
      groupsIgnore: false,
      alwaysOnline: false,
      readMessages: false,
      syncFullHistory: false,
      readStatus: false,
    },
  });

  const rejectCall = form.watch("rejectCall");

  const loadSettings = useCallback(async () => {
    if (!instanceName || !isOpen) return;

    setIsLoadingSettings(true);
    try {
      const result = await fetchInstanceSettings({ instanceName });

      if (result.success && result.settings) {
        // Reset form with current settings
        form.reset({
          rejectCall: result.settings.rejectCall || false,
          groupsIgnore: result.settings.groupsIgnore || false,
          alwaysOnline: result.settings.alwaysOnline || false,
          readMessages: result.settings.readMessages || false,
          syncFullHistory: result.settings.syncFullHistory || false,
          readStatus: result.settings.readStatus || false,
        });
      } else if (result.error) {
        toast.error(`Erro ao carregar configurações: ${result.error}`);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro inesperado ao carregar configurações.");
    } finally {
      setIsLoadingSettings(false);
    }
  }, [instanceName, isOpen, form]);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    try {
      const result = await updateInstanceSettings({
        instanceName,
        ...data,
      });

      if (result.success) {
        toast.success(result.success);
        onClose();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro inesperado ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações da Instância
          </DialogTitle>
          <DialogDescription>
            Configure o comportamento da instância <strong>{instanceName}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoadingSettings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando configurações...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seção: Chamadas */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Chamadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure como a instância lida com chamadas recebidas
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="rejectCall"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Rejeitar Chamadas Automaticamente
                        </FormLabel>
                        <FormDescription>
                          Quando ativado, todas as chamadas serão rejeitadas automaticamente
                          com uma mensagem educada.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {rejectCall && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Mensagem automática:</strong> &quot;Olá! Não atendo chamadas no WhatsApp.
                      Envie sua mensagem e retorno assim que possível.&quot;
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Seção: Mensagens */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Mensagens</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure como a instância processa mensagens
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="readMessages"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Marcar Mensagens como Lidas
                        </FormLabel>
                        <FormDescription>
                          Quando ativado, as mensagens recebidas serão automaticamente
                          marcadas como lidas.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="readStatus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Confirmar Leitura de Mensagens
                        </FormLabel>
                        <FormDescription>
                          Quando ativado, enviará confirmações de leitura (ticks azuis)
                          para mensagens recebidas.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Seção: Grupos */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Grupos</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure o comportamento em grupos do WhatsApp
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="groupsIgnore"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Ignorar Mensagens de Grupos
                        </FormLabel>
                        <FormDescription>
                          Quando ativado, mensagens de grupos serão ignoradas e não
                          processadas pelos agentes IA.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Seção: Status e Sincronização */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Status e Sincronização</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure presença online e sincronização de dados
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="alwaysOnline"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Sempre Online
                        </FormLabel>
                        <FormDescription>
                          Quando ativado, a instância aparecerá sempre como online
                          no WhatsApp.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="syncFullHistory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Sincronizar Histórico Completo
                        </FormLabel>
                        <FormDescription>
                          Quando ativado, todo o histórico de mensagens será sincronizado.
                          <span className="text-orange-600 dark:text-orange-400 font-medium block mt-1">
                            ⚠️ Pode consumir mais recursos e tempo para sincronizar.
                          </span>
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving || isLoadingSettings}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
