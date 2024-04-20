import { ZodObject, ZodRawShape, z } from "zod";
import {
  ActionEntity,
  isColorUserActionEntity,
  isDashUserActionEntity,
  isGrowUserActionEntity,
  isJumpUserActionEntity,
} from "../dto";
export const jumpActionData = {
  data: z.object({
    action: z.object({
      velocityX: z.number().min(-100).max(100).optional(),
      velocityY: z.number().min(-100).max(100).optional(),
    }),
  }),
};

export const colorActionData = {
  data: z.union([
    z.object({
      arguments: z.array(z.literal("color")).min(1).max(1),
    }),
    z.object({
      action: z.object({
        color: z.string().min(1),
      }),
    }),
  ]),
};

export const growActionData = {
  data: z.object({
    action: z.object({
      duration: z.number().int().min(0).max(999999).optional(),
      scale: z.number().int().min(1).max(10).optional(),
    }),
  }),
};

export const dashActionData = {
  data: z.object({
    action: z.object({
      force: z.number().min(0).max(100).optional(),
    }),
  }),
};

export const getActionableEntityFormSchema = (
  action: ActionEntity,
  schema: ZodObject<ZodRawShape>,
) => {
  if (isColorUserActionEntity(action)) {
    return schema.extend(colorActionData);
  }

  if (isGrowUserActionEntity(action)) {
    return schema.extend(growActionData);
  }

  if (isJumpUserActionEntity(action)) {
    return schema.extend(jumpActionData);
  }

  if (isDashUserActionEntity(action)) {
    return schema.extend(dashActionData);
  }

  return schema;
};
