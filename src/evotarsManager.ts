import {
  MessageEntity,
  RaidData,
  TwitchChatterEntity,
  UserActionEntity,
  isColorUserActionEntity,
  isDashUserActionEntity,
  isGrowUserActionEntity,
  isJumpUserActionEntity,
  isSpriteUserActionEntity,
} from './types';
import * as PIXI from 'pixi.js';
import tinycolor from 'tinycolor2';
import { app } from './app';
import { Evotar, EvotarProps } from './entities/Evotar';
import { timers } from './helpers/timer';

type EvotarsManagerSubscription = {
  onAdd: (evotar: Evotar) => void;
  onDelete: (evotar: Evotar) => void;
};

const EVOTAR_DESPAWN_TIMER = 1000 * 60 * 5;

class EvotarsManager {
  private viewers: Record<string, Evotar | undefined> = {};

  private raiders: Evotar[] = [];

  private lastEvotarActivity: Record<string, number | undefined> = {};

  private subscriptions: EvotarsManagerSubscription[] = [];

  public subscribe(subscription: EvotarsManagerSubscription) {
    this.subscriptions.push(subscription);
  }

  public update() {
    for (const id in this.viewers) {
      const viewer = this.viewers[id];

      if (viewer) {
        viewer.update();
      }
    }

    for (const evotar of this.raiders) {
      evotar.update();
    }
  }

  public processRaid(data: RaidData) {
    if (!app.settings.fallingRaiders) {
      return;
    }

    const time = (1 / data.viewers) * 5000;

    for (let i = 0; i < data.viewers; i++) {
      const evotar = new Evotar({
        isAnonymous: true,
        zIndex: -1,
        sprite: 'agent',
        color: new PIXI.Color(data.broadcaster.info.color),
      });

      timers.add(time * i, () => {
        this.addRaider(evotar);
        evotar.spawn({ isFalling: true });
      });

      timers.add(i * time + 30000, () => {
        evotar.despawn({
          onComplete: () => {
            this.deleteRaider(evotar);
          },
        });
      });
    }

    const evotar = this.viewers[data.broadcaster.id];

    const props: EvotarProps = {
      ...this.prepareEvotarProps(
        data.broadcaster.info.displayName,
        data.broadcaster.info.color,
      ),
      scale: 8,
    };

    const spawnBroadcaster = () => {
      const evotar = new Evotar(props);
      this.addViewer(data.broadcaster.id, evotar);
      evotar.spawn({ isFalling: true, positionX: 0.5 });
    };

    this.lastEvotarActivity[data.broadcaster.id] = performance.now();

    if (!evotar) {
      spawnBroadcaster();
    } else {
      evotar.despawn({
        onComplete: () => {
          spawnBroadcaster();
        },
      });
    }
  }

  public processChatters(data: TwitchChatterEntity[]) {
    for (const id in this.viewers) {
      const lastMessageTime = this.lastEvotarActivity[id];
      const spawnedRecently =
        !!lastMessageTime &&
        performance.now() - lastMessageTime < EVOTAR_DESPAWN_TIMER;

      if (data.every((chatter) => chatter.userId != id) && !spawnedRecently) {
        const evotar = this.viewers[id];

        if (evotar) {
          evotar.despawn({
            onComplete: () => {
              this.deleteViewer(id, evotar);
            },
          });
        }
      }
    }

    if (app.settings.showAnonymousEvotars) {
      for (const chatter of data) {
        const evotar = this.viewers[chatter.userId];

        if (!evotar) {
          const props = {
            name: chatter.name,
            isAnonymous: !this.hasActivity(chatter.userId),
          };

          const evotar = new Evotar(props);
          evotar.spawn();

          this.addViewer(chatter.userId, evotar);
        }
      }
    }
  }

  private hasActivity = (userId: string): boolean =>
    !!this.lastEvotarActivity[userId];

  public doAction(action: UserActionEntity, evotar: Evotar) {
    if (isJumpUserActionEntity(action)) {
      evotar.jump({
        velocityX: action.data.velocityX,
        velocityY: action.data.velocityY,
        cooldown: action.cooldown,
      });
    }

    if (isDashUserActionEntity(action)) {
      evotar.dash({ force: action.data.force, cooldown: action.cooldown });
    }

    if (isColorUserActionEntity(action)) {
      const color = tinycolor(action.data.color);

      if (color && color.isValid()) {
        evotar.setUserProps({ color: new PIXI.Color(action.data.color) });
      }
    }

    if (isGrowUserActionEntity(action)) {
      evotar.scale({
        value: action.data.scale,
        duration: action.data.duration,
        cooldown: action.cooldown,
      });
    }

    if (isSpriteUserActionEntity(action)) {
      evotar.setSprite(action.data.sprite);
    }
  }

  private prepareEvotarProps(
    name: string,
    color?: string,
    sprite?: string,
  ): EvotarProps {
    const props: EvotarProps = {
      name,
      isAnonymous: false,
    };

    if (sprite) {
      props.sprite = sprite;
    }

    if (color) {
      props.color = new PIXI.Color(color);
    }

    return props;
  }

  public processAction(action: UserActionEntity): void {
    const evotar = this.viewers[action.userId];

    const props: EvotarProps = this.prepareEvotarProps(
      action.info.displayName,
      action.info.color,
      action.info.sprite,
    );

    if (!evotar) {
      const evotar = new Evotar(props);

      evotar.spawn({
        onComplete: () => {
          const evotar = this.viewers[action.userId];
          if (evotar) {
            this.doAction(action, evotar);
          }
        },
      });

      this.addViewer(action.userId, evotar);
    } else {
      this.doAction(action, evotar);
      evotar.setProps(props);
    }
  }

  public processMessage(data: MessageEntity): void {
    const props: EvotarProps = this.prepareEvotarProps(
      data.info.displayName,
      data.info.color,
      data.info.sprite,
    );

    let evotar = this.viewers[data.userId];

    if (!evotar) {
      const isFalling = app.settings.fallingEvotars
        ? !this.hasActivity(data.userId)
        : false;

      evotar = new Evotar(props);
      evotar.spawn({ isFalling });

      this.addViewer(data.userId, evotar);
    } else {
      evotar.setProps(props);
    }

    this.lastEvotarActivity[data.userId] = performance.now();

    if (data.message) {
      evotar.addMessage(data.message);
    }

    if (data.emotes.length > 0) {
      evotar.spitEmotes(data.emotes);
    }
  }

  public addViewer(id: string, evotar: Evotar): void {
    this.subscriptions.forEach((s) => s.onAdd(evotar));
    this.viewers[id] = evotar;
  }

  public deleteViewer(id: string, evotar: Evotar): void {
    this.subscriptions.forEach((s) => s.onDelete(evotar));
    delete this.viewers[id];
  }

  public addRaider(evotar: Evotar): void {
    this.subscriptions.forEach((s) => s.onAdd(evotar));
    this.raiders.push(evotar);
  }

  public deleteRaider(evotar: Evotar): void {
    this.subscriptions.forEach((s) => s.onDelete(evotar));
    this.raiders = this.raiders.filter((raider) => raider != evotar);
  }

  public zIndexEvotarMax(from: number) {
    return Object.values(this.viewers).reduce((zIndex, evotar) => {
      return evotar && zIndex <= evotar.container.zIndex
        ? evotar.container.zIndex + 1
        : zIndex;
    }, from);
  }

  public zIndexEvotarMin(from: number) {
    return Object.values(this.viewers).reduce((zIndex, evotar) => {
      return evotar && zIndex >= evotar.container.zIndex
        ? evotar.container.zIndex - 1
        : zIndex;
    }, from);
  }
}

export const evotarsManager = new EvotarsManager();
