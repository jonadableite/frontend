// src/app/(protected)/conta/_components/ProfileForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/db/schema";

const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  image: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  // Altere 'currentUser' para 'user'
  user: User;
}

// Altere a desestruturação para receber 'user'
export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "", // Use 'user' diretamente
      image: user.image || "", // Use 'user' diretamente
    },
  });

  const currentImage =
    form.watch("image") || user.image || "/placeholder-avatar.jpg";

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        "Por favor, selecione um arquivo de imagem válido (JPG, PNG, GIF, etc.).",
      );
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (limite do frontend, backend tem 50MB)
    if (file.size > MAX_FILE_SIZE) {
      toast.error("A imagem não pode ter mais de 5MB.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "image");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao fazer upload da imagem.");
      }

      const { url: imageUrl } = await response.json();
      form.setValue("image", imageUrl, { shouldDirty: true });
      toast.success("Foto de perfil enviada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar a foto de perfil.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao atualizar perfil.");
      }

      toast.success("Perfil atualizado com sucesso!");
      form.reset(data);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentImage} alt={user.name || "User"} />
          <AvatarFallback>
            {user.name ? user.name.charAt(0) : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 gap-1.5">
          <Label>Foto de Perfil</Label>
          <p className="text-muted-foreground text-sm">
            Clique no botão para enviar uma nova foto de perfil. Tamanho máximo:
            5MB.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="w-fit"
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Escolher Foto
              </>
            )}
          </Button>
          {form.formState.errors.image && (
            <p className="text-sm text-red-500">
              {form.formState.errors.image.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" placeholder="Seu nome" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user.email}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-muted-foreground text-sm">
          O email não pode ser alterado diretamente aqui.
        </p>
      </div>
      <Button
        variant="magic"
        type="submit"
        disabled={isSubmitting || !form.formState.isDirty}
      >
        {isSubmitting ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
}

export default ProfileForm;
