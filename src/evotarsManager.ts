import {
  MessageEntity,
  RaidEntity,
  TwitchChatterEntity,
  UserActionEntity,
  isAddJumpHitUserActionEntity,
  isColorUserActionEntity,
  isDashUserActionEntity,
  isGrowUserActionEntity,
  isJumpUserActionEntity,
  isResurrectHitUserActionEntity,
  isSpriteUserActionEntity,
} from './types';
import * as PIXI from 'pixi.js';
import tinycolor from 'tinycolor2';
import { app } from './app';
import { Evotar, EvotarProps, EvotarSpawnProps } from './entities/Evotar';
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

  public getViewerEvotars() {
    return this.viewers;
  }

  public getViewerEvotar(id: number) {
    return this.viewers[id];
  }

  public async spawnViewerEvotar(
    userId: string,
    props: EvotarProps,
    spawnProps: EvotarSpawnProps,
  ): Promise<Evotar> {
    const evotar = new Evotar();
    this.addViewer(userId, evotar);

    await evotar.setProps(props);
    evotar.spawn(spawnProps);

    this.lastEvotarActivity[userId] = performance.now();

    return evotar;
  }

  public processRaid(data: RaidEntity) {
    if (!app.settings.fallingRaiders) {
      return;
    }

    const time = (1 / data.viewers.count) * 5000;

    for (let i = 0; i < data.viewers.count; i++) {
      const evotar = new Evotar();

      evotar.setProps({
        isAnonymous: true,
        zIndex: -1,
        sprite: data.viewers.sprite,
        color: new PIXI.Color(data.broadcaster.info.color),
      });

      timers.add(time * i, () => {
        this.addRaider(evotar);
        evotar.spawn({ isFalling: true });
      });

      timers.add(i * time + 60000, () => {
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
        data.broadcaster.info.sprite,
      ),
      scale: 2,
    };

    const spawnBroadcaster = () => {
      const evotar = new Evotar();
      evotar.setProps(props);
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

  public async processChatters(data: TwitchChatterEntity[]) {
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

          const evotar = new Evotar();
          await evotar.setProps(props);
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
      });
    }

    if (isDashUserActionEntity(action)) {
      evotar.dash({ force: action.data.force });
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
      });
    }

    if (isSpriteUserActionEntity(action)) {
      evotar.setSprite(action.data.sprite);
    }

    if (isAddJumpHitUserActionEntity(action)) {
      evotar.addJumpHit(action.data.jump_hits);
    }

    if (isResurrectHitUserActionEntity(action)) {
      evotar.resurrect();
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
      try {
        props.color = new PIXI.Color(color);
      } catch (e) {}
    }

    return props;
  }

  public async processAction(action: UserActionEntity): Promise<void> {
    const evotar = this.viewers[action.userId];

    const props: EvotarProps = this.prepareEvotarProps(
      action.info.displayName,
      action.info.color,
      action.info.sprite,
    );

    if (!evotar) {
      const evotar = new Evotar();

      this.addViewer(action.userId, evotar);
      await evotar.setProps(props);

      evotar.spawn({
        onComplete: () => {
          const evotar = this.viewers[action.userId];
          if (evotar) {
            this.doAction(action, evotar);
          }
        },
      });
    } else {
      await evotar.setProps(props);
      this.doAction(action, evotar);
    }
  }

  public async processMessage(data: MessageEntity): Promise<void> {
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

      evotar = new Evotar();
      this.addViewer(data.userId, evotar);

      await evotar.setProps(props);
      evotar.spawn({ isFalling });
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
