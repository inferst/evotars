import { z } from "zod";
import {
  createTwitchRewardDtoSchema,
  updateTwitchRewardDtoSchema,
} from "../schema/reward";
import { ActionableData } from "./action";

export type UpdateTwitchRewardDto = z.infer<typeof updateTwitchRewardDtoSchema>;

export type CreateTwitchRewardDto = z.infer<typeof createTwitchRewardDtoSchema>;

export type RewardEntity = {
  id: number;
  actionId: number;
  userId: number;
  platformId: number;
  platformRewardId: string;
  data: ActionableData;
};

export type TwitchRewardEntity = {
  title?: string;
  cost?: number;
  isDeleted: boolean;
  isActive: boolean;
} & RewardEntity;
