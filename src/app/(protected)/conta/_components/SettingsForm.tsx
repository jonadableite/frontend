// src/app/(protected)/conta/_components/SettingsForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User } from "@/db/schema";
import { authClient } from "@/lib/auth-client";

const timezones = [
  "America/Sao_Paulo",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "UTC",
];

const settingsSchema = z.object({
  timezone: z.string().min(1, "Fuso horário é obrigatório"),
  theme: z.enum(["light", "dark", "system"]).optional().default("system"),
  receiveNotifications: z.boolean().optional().default(true),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface UserSettingsData {
  theme?: "light" | "dark" | "system";
  receiveNotifications?: boolean;
}

interface SettingsFormProps {
  user: User & { settings?: UserSettingsData | null };
}

const SettingsForm: React.FC<SettingsFormProps> = ({ user }) => {
  const { refetch } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsFormValues, any>,
    defaultValues: {
      timezone: user.timezone ?? "America/Sao_Paulo",
      theme: user.settings?.theme ?? "system",
      receiveNotifications: user.settings?.receiveNotifications ?? true,
    },
  });

  const onSubmit = async (values: SettingsFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Falha ao atualizar configurações.",
        );
      }

      // Após a atualização bem-sucedida, force o refetch da sessão
      await refetch();

      toast.success("Configurações atualizadas com sucesso!");
      form.reset(values);

      // Aplica o tema imediatamente se estiver no navegador
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", values.theme);
        document.documentElement.setAttribute("data-theme", values.theme);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar configurações.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-1.5">
        <Label htmlFor="timezone">Fuso Horário</Label>
        <Select
          onValueChange={(value) =>
            form.setValue("timezone", value, { shouldDirty: true })
          }
          defaultValue={form.watch("timezone")}
        >
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Selecione seu fuso horário" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.timezone && (
          <p className="text-sm text-red-500">
            {form.formState.errors.timezone.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="theme">Tema</Label>
          <p className="text-muted-foreground text-sm">
            Escolha o tema da interface: claro, escuro ou do sistema.
          </p>
        </div>
        <Select
          onValueChange={(value) =>
            form.setValue("theme", value as "light" | "dark" | "system", {
              shouldDirty: true,
            })
          }
          defaultValue={form.watch("theme")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tema" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Claro</SelectItem>
            <SelectItem value="dark">Escuro</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="receiveNotifications">
            Receber Notificações por Email
          </Label>
          <p className="text-muted-foreground text-sm">
            Receba atualizações importantes e alertas por email.
          </p>
        </div>
        <Switch
          id="receiveNotifications"
          checked={form.watch("receiveNotifications")}
          onCheckedChange={(checked) =>
            form.setValue("receiveNotifications", checked, {
              shouldDirty: true,
            })
          }
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
        {isSubmitting ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </form>
  );
};

export default SettingsForm;
