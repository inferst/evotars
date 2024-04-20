import { UserInfo } from "./user";

export type ActionData = Record<string, string | number | undefined>;

export type ActionableData = {
  arguments: string[];
  action: ActionData;
};

export type ActionEntity = {
  id: number;
  name: string;
  title: string;
  description: string;
  data: ActionData;
};

export type UserActionEntity = {
  userId: string;
  cooldown: number;
  info: UserInfo;
} & ActionEntity;

export type JumpUserActionEntity = {
  name: "jump";
  data: {
    velocityX: number;
    velocityY: number;
  };
} & UserActionEntity;

export type ColorUserActionEntity = {
  name: "color";
  data: {
    color: string;
  };
} & UserActionEntity;

export type GrowUserActionEntity = {
  name: "grow";
  data: {
    duration: number;
    scale: number;
  };
} & UserActionEntity;

export type DashUserActionEntity = {
  name: "dash";
  data: {
    force: number;
  };
} & UserActionEntity;

export const isJumpUserActionEntity = (
  entity: ActionEntity,
): entity is JumpUserActionEntity => entity.name == "jump";

export const isColorUserActionEntity = (
  entity: ActionEntity,
): entity is ColorUserActionEntity => entity.name == "color";

export const isGrowUserActionEntity = (
  entity: ActionEntity,
): entity is GrowUserActionEntity => entity.name == "grow";

export const isDashUserActionEntity = (
  entity: ActionEntity,
): entity is DashUserActionEntity => entity.name == "dash";
