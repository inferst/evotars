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
import { TombStone } from './entities/TombStone';

type EvotarsManagerSubscription = {
  onAdd: (evotar: Evotar) => void;
  onDelete: (evotar: Evotar) => void;
};

const EVOTAR_DESPAWN_TIMER = 1000 * 60 * 5;

class EvotarsManager {
  public viewers: Record<string, Evotar | undefined> = {};
  public tombstones: TombStone[] = [];

  public raiders: Evotar[] = [];

  public recentEvotarActivity: Record<string, number | undefined> = {};

  public subscriptions: EvotarsManagerSubscription[] = [];

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

    for (const raider of this.raiders) {
      raider.update();
    }

    for (const object of this.tombstones) {
      object.update();
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

    this.recentEvotarActivity[userId] = performance.now();

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
      isImmortal: true,
    };

    const spawnBroadcaster = () => {
      const evotar = new Evotar();
      evotar.setProps(props);
      this.addViewer(data.broadcaster.id, evotar);
      evotar.spawn({ isFalling: true, positionX: 0.5 });
    };

    this.recentEvotarActivity[data.broadcaster.id] = performance.now();

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

  public despawnEvotar(id: string, evotar: Evotar) {
    evotar.despawn({
      onComplete: () => {
        this.deleteViewer(id, evotar);
      },
    });

    const tombStone = this.tombstones.find((stone) => stone.id == id);

    if (tombStone) {
      tombStone.despawn(true, () => {
        this.deleteTombStone(tombStone);
      });
    }
  }

  public async processChatters(data: TwitchChatterEntity[]) {
    for (const id in this.viewers) {
      const lastMessageTime = this.recentEvotarActivity[id];
      const spawnedRecently =
        !!lastMessageTime &&
        performance.now() - lastMessageTime < EVOTAR_DESPAWN_TIMER;

      if (data.every((chatter) => chatter.userId != id) && !spawnedRecently) {
        const evotar = this.viewers[id];

        if (evotar) {
          this.despawnEvotar(id, evotar);
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

  public hasActivity = (userId: string): boolean =>
    !!this.recentEvotarActivity[userId];

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
      evotar.addJumpHit(action.data.count);
    }

    if (isResurrectHitUserActionEntity(action)) {
      evotar.resurrect();
    }
  }

  public prepareEvotarProps(
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

    this.recentEvotarActivity[data.userId] = performance.now();

    if (data.message) {
      evotar.addMessage(data.message);
    }

    if (data.emotes.length > 0) {
      evotar.spitEmotes(data.emotes);
    }
  }

  public getViewerId(evotar: Evotar): string | undefined {
    for (const id in this.viewers) {
      if (this.viewers[id] == evotar) {
        return id;
      }
    }

    return;
  }

  public resurrect(evotar: Evotar) {
    const id = this.getViewerId(evotar);

    if (id) {
      const tombStone = this.tombstones.find((obj) => obj.id == id);

      if (tombStone) {
        evotar.setPosition(tombStone.container.position);
        tombStone.despawn();
        this.deleteTombStone(tombStone);
      }
    }
  }

  public kill(evotar: Evotar) {
    const id = this.getViewerId(evotar);

    if (id) {
      const tombStone = new TombStone(id);
      const position = evotar.getCenterPosition();
      this.addTombStone(tombStone);
      tombStone.spawn({
        position,
        scale: evotar.getScale(),
      });
    }
  }

  public addTombStone(object: TombStone): void {
    app.stage.addChild(object.container);
    this.tombstones.push(object);
  }

  public deleteTombStone(object: TombStone): void {
    app.stage.removeChild(object.container);
    this.tombstones = this.tombstones.filter((obj) => obj != object);
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
