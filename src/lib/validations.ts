// src/lib/validations.ts
import { z } from "zod";

export const CreateInstanceSchema = z.object({
  instanceName: z.string().min(1, "Nome da instância é obrigatório"),
});

export const InstanceNameSchema = z.object({
  instanceName: z.string().min(1, "Nome da instância é obrigatório"),
});

export const SetPresenceSchema = z.object({
  instanceName: z.string().min(1, "Nome da instância é obrigatório."),
  presence: z.enum(["available", "unavailable", "composing", "paused", "recording"]),
});