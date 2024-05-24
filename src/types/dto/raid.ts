import { UserInfo } from './user';

export type RaidEntity = {
  broadcaster: {
    id: string;
    info: UserInfo;
  };
  viewers: {
    count: number;
    sprite: string;
  };
};
