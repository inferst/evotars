import { z } from "zod";
import {
  createCommandDtoSchema,
  updateCommandDtoSchema,
} from "../schema/command";
import { ActionableData } from "./action";

export type UpdateCommandDto = z.infer<typeof updateCommandDtoSchema>;

export type CreateCommandDto = z.infer<typeof createCommandDtoSchema>;

export type CommandEntity = {
  id: number;
  actionId: number;
  userId: number;
  isActive: boolean;
  text: string;
  cooldown: number;
  data: ActionableData;
};
