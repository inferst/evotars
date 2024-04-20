import { z } from "zod";
import { UpdateSettingsDto } from "../dto";

export const updateSettingsDtoSchema = z
  .object({
    showAnonymousDudes: z.boolean().default(false).optional(),
    fallingDudes: z.boolean().default(true).optional(),
    fallingRaiders: z.boolean().default(false).optional(),
  })
  .strict();

export const defaultSettingsValues: UpdateSettingsDto = {
  showAnonymousDudes: false,
  fallingDudes: true,
  fallingRaiders: false,
};

export type UpdateSettingsForm = UpdateSettingsDto;
