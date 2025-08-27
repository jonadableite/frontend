// src/app/(protected)/whatsapp/components/instance-proxy-modal.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  findInstanceProxy,
  ProxyDetails,
  setInstanceProxy,
} from "@/actions/instance";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const ProxySchema = z
  .object({
    enabled: z.boolean().default(false),
    host: z.string().optional(),
    port: z.string().optional(),
    protocol: z.enum(["http", "https", "socks4", "socks5"]).optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.enabled) {
      if (!data.host) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Host é obrigatório quando o proxy está ativado.",
          path: ["host"],
        });
      }
      if (!data.port) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Porta é obrigatória quando o proxy está ativado.",
          path: ["port"],
        });
      } else if (isNaN(parseInt(data.port)) || parseInt(data.port) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Porta deve ser um número válido e positivo.",
          path: ["port"],
        });
      }
      if (!data.protocol) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Protocolo é obrigatório quando o proxy está ativado.",
          path: ["protocol"],
        });
      }
    }
  });

type ProxyFormValues = z.infer<typeof ProxySchema>;

interface InstanceProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  onProxySetSuccess: (instanceName: string) => void;
}

export function InstanceProxyModal({
  isOpen,
  onClose,
  instanceName,
  onProxySetSuccess,
}: InstanceProxyModalProps) {
  const form = useForm({
    resolver: zodResolver(ProxySchema),
    defaultValues: {
      enabled: true, // Definido como true para que os campos preenchidos sejam visíveis
      host: "proxy.proxyads.com",
      port: "", // Porta permanece vazia para preenchimento do usuário
      protocol: "socks5", // Protocolo SOCKS5
      username: "6np_hermesoc5ot",
      password: "8ykf3axzkkw*oe3e8v",
    },
  });

  const { handleSubmit, control, reset, watch, setValue } = form;
  const isEnabled = watch("enabled");
  const [isLoadingProxy, setIsLoadingProxy] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && instanceName) {
      setIsLoadingProxy(true);
      findInstanceProxy({ instanceName })
        .then((result) => {
          if (result.success && result.proxy) {
            const proxyData = result.proxy;
            reset({
              enabled: proxyData.enabled || false,
              host: proxyData.host || "",
              port: proxyData.port ? String(proxyData.port) : "",
              protocol: proxyData.protocol || "https",
              username: proxyData.username || "",
              password: proxyData.password || "",
            });
          } else {
            // Se não encontrar proxy ou houver erro, use os valores padrão
            toast.info(result.error || "Nenhuma configuração de proxy encontrada. Usando valores padrão.");
            reset({
              enabled: true,
              host: "proxy.proxyads.com",
              port: "",
              protocol: "socks5",
              username: "6np_hermesoc5ot",
              password: "8ykf3axzkkw*oe3e8v",
            });
          }
        })
        .catch((error) => {
          console.error("Failed to fetch proxy settings:", error);
          toast.error("Erro ao carregar configurações de proxy. Usando valores padrão.");
          reset({
            enabled: true,
            host: "proxy.proxyads.com",
            port: "",
            protocol: "socks5",
            username: "6np_hermesoc5ot",
            password: "8ykf3axzkkw*oe3e8v",
          });
        })
        .finally(() => {
          setIsLoadingProxy(false);
        });
    } else {
      // Quando o modal fecha, reset para os valores padrão
      reset({
        enabled: true,
        host: "proxy.proxyads.com",
        port: "",
        protocol: "socks5",
        username: "6np_hermesoc5ot",
        password: "8ykf3axzkkw*oe3e8v",
      });
    }
  }, [isOpen, instanceName, reset]);

  const onSubmit = async (values: ProxyFormValues) => {
    setIsSaving(true);
    try {
      const proxyDetailsToSend: ProxyDetails = {
        enabled: values.enabled,
      };

      if (values.enabled) {
        proxyDetailsToSend.host = values.host || undefined;
        proxyDetailsToSend.port = values.port || undefined;
        proxyDetailsToSend.protocol = values.protocol || undefined;
        proxyDetailsToSend.username = values.username || undefined;
        proxyDetailsToSend.password = values.password || undefined;
      }

      const result = await setInstanceProxy({
        instanceName,
        proxyDetails: proxyDetailsToSend,
      });

      if (result.success) {
        toast.success(result.message);
        onProxySetSuccess(instanceName);
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Erro ao salvar configurações de proxy:", error);
      toast.error("Erro inesperado ao salvar configurações de proxy.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Proxy para {instanceName}</DialogTitle>
          <DialogDescription>
            Defina as configurações de proxy para esta instância.
          </DialogDescription>
        </DialogHeader>
        {isLoadingProxy ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground mt-4 text-sm">
              Carregando configurações de proxy...
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativar Proxy</FormLabel>
                      <FormDescription>
                        Ative ou desative o uso de proxy para esta instância.
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

              {isEnabled && (
                <>
                  <FormField
                    control={control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Host do Proxy</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: 192.168.1.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porta do Proxy</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="ex: 8000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="protocol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocolo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um protocolo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="https">HTTPS</SelectItem>
                            <SelectItem value="socks4">SOCKS4</SelectItem>
                            <SelectItem value="socks5">SOCKS5</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Usuário do proxy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Senha do proxy"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </form>
          </Form>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving || isLoadingProxy}
            onClick={handleSubmit(onSubmit)}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
