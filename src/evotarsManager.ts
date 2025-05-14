import {
  MessageEntity,
  RaidEntity,
  TwitchChatterEntity,
  UserActionEntity,
  isAddJumpHitsUserActionEntity,
  isColorUserActionEntity,
  isDashUserActionEntity,
  isGrowUserActionEntity,
  isJumpUserActionEntity,
  isResurrectUserActionEntity,
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
  public viewerArray: string[] = [];

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

  public getEvotars() {
    return Object.values(this.viewers).concat(this.raiders);
  }

  public async spawnViewerEvotar(
    userId: string,
    props: EvotarProps,
    spawnProps: EvotarSpawnProps,
  ): Promise<Evotar> {
    const evotar = new Evotar();
    this.addViewer(userId, evotar);

    if (app.settings.maxEvotars) {
      if (this.viewerArray.length > app.settings.maxEvotars) {
        const id = this.viewerArray.shift();
        const evotar = id != undefined ? this.viewers[id] : undefined;

        if (id && evotar) {
          this.deleteViewer(id, evotar);
        }
      }
    }

    await evotar.setProps(props);
    evotar.spawn(spawnProps);

    this.recentEvotarActivity[userId] = performance.now();

    return evotar;
  }

  public async processRaid(data: RaidEntity) {
    if (!app.settings.fallingRaiders) {
      return;
    }

    const time = (1 / data.viewers.count) * 5000;

    let count = data.viewers.count;

    if (app.settings.maxEvotars) {
      count = Math.min(count, app.settings.maxEvotars);
    }

    for (let i = 0; i < data.viewers.count; i++) {
      const evotar = new Evotar();

      await evotar.setProps({
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
        this.despawnRaider(evotar);
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

    const spawnBroadcaster = async () => {
      await this.spawnViewerEvotar(data.broadcaster.id, props, {
        isFalling: true,
        positionX: 0.5,
      });
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

  public despawnTombStone(evotar: Evotar): void {
    const tombStone = this.tombstones.find((stone) => stone.evotar == evotar);

    if (tombStone) {
      tombStone.despawn(true, () => {
        this.deleteTombStone(tombStone);
      });
    }
  }

  public despawnRaider(evotar: Evotar) {
    evotar.despawn({
      onComplete: () => {
        this.deleteRaider(evotar);
      },
    });

    this.despawnTombStone(evotar);
  }

  public despawnViewer(id: string, evotar: Evotar) {
    evotar.despawn({
      onComplete: () => {
        this.deleteViewer(id, evotar);
      },
    });

    this.despawnTombStone(evotar);
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
          this.despawnViewer(id, evotar);
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
            sprite: 'default',
          };

          await this.spawnViewerEvotar(chatter.userId, props, {});
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

    if (isAddJumpHitsUserActionEntity(action)) {
      evotar.addJumpHit(action.data.count);
    }

    if (isResurrectUserActionEntity(action)) {
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
      await this.spawnViewerEvotar(action.userId, props, {
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

      evotar = await this.spawnViewerEvotar(data.userId, props, {
        isFalling,
      });
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

  public resurrect(evotar: Evotar) {
    const tombStone = this.tombstones.find((obj) => obj.evotar == evotar);

    if (tombStone) {
      evotar.setPosition(tombStone.container.position);
      tombStone.despawn();
      this.deleteTombStone(tombStone);
    }
  }

  public kill(evotar: Evotar) {
    const tombStone = new TombStone(evotar);
    this.addTombStone(tombStone);
    tombStone.spawn();
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
    this.viewerArray.push(id);
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
