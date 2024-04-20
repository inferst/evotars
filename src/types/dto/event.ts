import { UserInfo } from './user';

export type RaidData = {
  broadcaster: {
    id: string;
    info: UserInfo;
  };
  viewers: number;
};
