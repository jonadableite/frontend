//src/app/(protected)/whatsapp/components/create-instance-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createInstance } from "@/actions/instance/create-instance";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateInstanceSchema } from "@/db/schema";

interface CreateInstanceFormProps {
  onClose: () => void;
}

export function CreateInstanceForm({ onClose }: CreateInstanceFormProps) {
  const form = useForm<z.infer<typeof CreateInstanceSchema>>({
    resolver: zodResolver(CreateInstanceSchema),
    defaultValues: {
      instanceName: "",
      webhookUrl: "",
      webhookEnabled: false,
    },
  });

  async function onSubmit(values: z.infer<typeof CreateInstanceSchema>) {
    const result = await createInstance(values);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      form.reset();
      onClose();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="instanceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Instância</FormLabel>
              <FormControl>
                <Input placeholder="minha-instancia-01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Criando..." : "Criar Instância"}
        </Button>
      </form>
    </Form>
  );
}
