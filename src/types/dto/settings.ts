import { z } from "zod";
import { updateSettingsDtoSchema } from "../schema/settings";

export type UpdateSettingsDto = z.infer<typeof updateSettingsDtoSchema>;

export type SettingsEntity = {
  showAnonymousDudes?: boolean;
  fallingDudes?: boolean;
  fallingRaiders?: boolean;
};
