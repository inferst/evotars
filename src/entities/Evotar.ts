import * as TWEEN from '@tweenjs/tween.js';
import * as PIXI from 'pixi.js';
import { app } from '../app';
import { FIXED_DELTA_TIME } from '../config/constants';
import { Timer } from '../helpers/timer';
import { evotarsManager } from '../evotarsManager';
import { soundService } from '../services/soundService';
import {
  Collider,
  EvotarSpriteTags,
  spriteService,
} from '../services/spriteService';
import { EvotarEmoteSpitter } from './EmoteSpitter';
import { EvotarMessage } from './Message';
import { EvotarName } from './Name';
import { EvotarSpriteContainer } from './SpriteContainer';
import { EvotarTrailEffect } from './TrailEffect';
import { delay } from '../helpers/delay';
import { EvotarInfo } from './Info';
import { checkCollisionDownUp } from '../collisionChecker';

export type EvotarProps = {
  name?: string;
  sprite?: string;
  color?: PIXI.Color;
  direction?: number;
  scale?: number;
  isAnonymous?: boolean;
  isImmortal?: boolean;
  zIndex?: number;
};

export type EvotarSpawnProps = {
  isFalling?: boolean;
  positionX?: number;
  onComplete?: () => void;
};

export type EvotarJumpProps = { velocityX?: number; velocityY?: number };

export type EvotarDepawnProps = {
  onComplete?: () => void;
};

type EvotarState = Required<EvotarProps>;

type UserProps = {
  color?: PIXI.Color;
};

export class Evotar {
  public container: PIXI.Container = new PIXI.Container();

  private userState: UserProps = {};

  public state: EvotarState = {
    name: '',
    sprite: '',
    color: new PIXI.Color('#969696'),
    direction: 1,
    scale: 1,
    isAnonymous: false,
    isImmortal: false,
    zIndex: 0,
  };

  private animationState: EvotarSpriteTags = EvotarSpriteTags.Idle;

  private sprite?: EvotarSpriteContainer;

  public trail: EvotarTrailEffect = new EvotarTrailEffect();

  private name: EvotarName = new EvotarName();

  private info: EvotarInfo = new EvotarInfo();

  private message: EvotarMessage = new EvotarMessage(() => {
    this.state.zIndex = evotarsManager.zIndexEvotarMax(this.container.zIndex);
  });

  private emoteSpitter: EvotarEmoteSpitter = new EvotarEmoteSpitter();

  private velocity: PIXI.PointData = {
    x: 0,
    y: 0,
  };

  private runSpeed = 0.05;

  private gravity = 0.2;

  private dashAcc = 3;

  private isJumping = false;

  private isHitJumping = false;

  private isDashing = false;

  private isDespawned = false;

  public isDead = false;

  deathTimer?: Timer;

  landTimer?: Timer;

  stateTimer?: Timer;

  scaleTimer?: Timer;

  spawnTween?: TWEEN.Tween<PIXI.Container>;

  fadeTween?: TWEEN.Tween<PIXI.Container>;

  scaleTween?: TWEEN.Tween<Evotar>;

  private offset = 0;

  private screenBounds = {
    left: this.offset,
    right: app.renderer.width - this.offset,
  };

  getCenterOffsetY(): number {
    if (this.sprite) {
      return (this.sprite.data.collider.h / 2) * this.getScale();
    }

    return 0;
  }

  getCenterPosition(): PIXI.PointData {
    return {
      x: this.container.position.x,
      y: this.container.position.y - this.getCenterOffsetY(),
    };
  }

  setPosition(position: PIXI.PointData) {
    this.container.position = position;
  }

  getScale(): number {
    if (this.sprite) {
      return this.state.scale * this.sprite.data.scale;
    }

    return this.state.scale;
  }

  getCollider(): Collider {
    if (this.sprite) {
      const offsetX = this.sprite.data.collider.x * this.getScale();
      const offsetY = this.sprite.data.collider.h * this.getScale();

      return {
        x: this.container.position.x - offsetX,
        y: this.container.position.y - offsetY,
        w: this.sprite.data.collider.w * this.getScale(),
        h: this.sprite.data.collider.h * this.getScale(),
      };
    }

    return {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };
  }

  constructor() {
    this.container.addChild(this.name.text);
    this.container.addChild(this.info.containter);
    this.container.addChild(this.emoteSpitter.container);
    this.container.addChild(this.message.container);

    this.container.sortableChildren = true;
  }

  public async resurrect() {
    if (this.deathTimer) {
      this.deathTimer.complete();
    }
  }

  public async die(): Promise<void> {
    if (this.state.isImmortal) {
      return;
    }

    this.isDead = true;
    this.container.visible = false;

    evotarsManager.kill(this);

    this.deathTimer = new Timer(1000 * 60 * 1, () => {
      if (!this.isDespawned && this.isDead) {
        this.isDead = false;
        this.container.visible = true;
        this.state.scale = 1;

        evotarsManager.resurrect(this);
      }
    });
  }

  spawn(props: EvotarSpawnProps = { isFalling: false }): void {
    if (!this.sprite) {
      return;
    }

    const collider = this.sprite.data.collider;
    const size = this.sprite.data.size;
    const fallingStartY = -(collider.y + collider.h - size.h / 2);
    const spawnY = props.isFalling ? fallingStartY : app.renderer.height;
    const spriteWidth = size.w * this.getScale();

    const x =
      props.positionX != undefined
        ? props.positionX * this.screenBounds.right
        : Math.random() * (this.screenBounds.right - spriteWidth) +
          spriteWidth / 2;
    const y = spawnY * this.getScale();

    this.container.x = x;
    this.container.y = y;

    this.state.direction = Math.random() > 0.5 ? 1 : -1;

    if (!props.isFalling) {
      const zIndex = evotarsManager.zIndexEvotarMin(this.container.zIndex);

      this.state.zIndex = zIndex;
      this.container.alpha = 0;

      this.spawnTween = new TWEEN.Tween(this.container)
        .to({ alpha: 1 }, 500)
        .onComplete(props.onComplete)
        .start();
    }

    this.stateTimer = new Timer(5000, () => {
      if (!this.isJumping && !this.isDead) {
        this.setAnimationState(EvotarSpriteTags.Run);
      }
    });
  }

  despawn(props: EvotarDepawnProps = {}): void {
    if (this.fadeTween && this.fadeTween.isPlaying()) {
      return;
    }

    this.fadeTween = new TWEEN.Tween(this.container)
      .to({ alpha: 0 }, 1000)
      .onComplete(() => {
        this.isDespawned = true;
        props.onComplete && props.onComplete();
      })
      .start();
  }

  scale(options: { value: number; duration: number }): void {
    if (this.scaleTween && this.scaleTween.isPlaying()) {
      return;
    }

    if (this.scaleTimer && !this.scaleTimer.isCompleted) {
      return;
    }

    this.scaleTween = new TWEEN.Tween(this)
      .to({ state: { scale: options.value ?? 2 } }, 2000)
      .onComplete(() => {
        this.scaleTimer = new Timer((options.duration ?? 10) * 1000, () => {
          this.scaleTween = new TWEEN.Tween(this)
            .to({ state: { scale: 1 } }, 2000)
            .start();
        });
      })
      .start();
  }

  addJumpHit(count: number) {
    this.info.addJumps(count);
  }

  async jump(options?: EvotarJumpProps): Promise<void> {
    if (this.isDespawned) {
      return;
    }

    if (!this.isJumping) {
      this.isJumping = true;

      soundService.play('jump');

      await delay(300);

      this.velocity.x = this.state.direction * (options?.velocityX ?? 3.5);
      this.velocity.y = options?.velocityY ?? -8;

      this.setAnimationState(EvotarSpriteTags.Jump);

      if (this.info.jumps > 0) {
        this.info.useJump();
        this.isHitJumping = true;
      }
    }
  }

  dash(options: { force: number }): void {
    if (this.isDespawned) {
      return;
    }

    if (!this.isDashing) {
      this.isDashing = true;
      this.velocity.x = this.state.direction * (options.force ?? 14);
    }
  }

  async setSprite(sprite: string) {
    if (sprite && sprite != this.state.sprite) {
      const data = await spriteService.getSpriteData(sprite);

      if (!data) {
        return;
      }

      if (this.sprite) {
        this.container.removeChild(this.sprite.container);
      }

      this.state.sprite = sprite;

      const animatedSprites = spriteService.getAnimatedSprites(sprite);
      this.sprite = new EvotarSpriteContainer(animatedSprites, data.data);
      this.container.addChild(this.sprite.container);
      this.trail.setSprite(this.sprite);

      this.setAnimationState(this.animationState, true);
    }
  }

  async setProps(props: EvotarProps) {
    if (props.sprite) {
      await this.setSprite(props.sprite);
    }

    this.state = { ...this.state, ...props };
  }

  setUserProps(props: UserProps) {
    this.userState = { ...this.userState, ...props };
  }

  private move() {
    if (!this.sprite) {
      return;
    }

    const collider = this.sprite.data.collider;

    const position = {
      x: this.container.position.x,
      y: this.container.position.y,
    };

    if (this.isDashing) {
      const currentVelocitySign = Math.sign(this.velocity.x);

      this.velocity.x =
        this.velocity.x -
        (currentVelocitySign * this.dashAcc) / Math.abs(this.velocity.x);

      if (currentVelocitySign != Math.sign(this.velocity.x)) {
        this.isDashing = false;
        this.velocity.x = 0;
      } else {
        position.x += this.velocity.x;
      }
    } else {
      if (this.stateTimer?.isCompleted) {
        this.stateTimer = new Timer(Math.random() * 5000, () => {
          if (this.animationState == EvotarSpriteTags.Idle) {
            this.setAnimationState(EvotarSpriteTags.Run);
          } else if (this.animationState == EvotarSpriteTags.Run) {
            this.setAnimationState(EvotarSpriteTags.Idle);
          }
        });
      }

      if (this.animationState == EvotarSpriteTags.Run) {
        const speed = this.runSpeed * this.state.direction;
        this.velocity.x = speed * FIXED_DELTA_TIME;
      }

      this.velocity.y = this.velocity.y + this.gravity;

      position.x += this.velocity.x;
      position.y += this.velocity.y;

      if (this.isOnGround(position.y)) {
        this.velocity.y = 0;
        this.velocity.x = 0;

        position.y = app.renderer.height;

        if (this.animationState == EvotarSpriteTags.Fall) {
          this.setAnimationState(EvotarSpriteTags.Land);
          this.landTimer = new Timer(200, () => {
            this.setAnimationState(EvotarSpriteTags.Idle);
            this.isJumping = false;
            this.isHitJumping = false;
          });
        }
      }

      if (this.velocity.y > 0) {
        this.setAnimationState(EvotarSpriteTags.Fall);
      }
    }

    if (this.animationState != EvotarSpriteTags.Idle || this.isDashing) {
      const halfSpriteWidth = (collider.w / 2) * this.getScale();

      const left = this.container.x - halfSpriteWidth < this.screenBounds.left;
      const right =
        this.container.x + halfSpriteWidth > this.screenBounds.right;

      if (left || right) {
        this.state.direction = -this.state.direction;
        this.velocity.x = -this.velocity.x;

        if (left) {
          position.x = this.screenBounds.left + halfSpriteWidth;
        }

        if (right) {
          position.x = this.screenBounds.right - halfSpriteWidth;
        }
      }
    }

    this.container.position.set(position.x, position.y);

    if (this.isHitJumping) {
      this.jumpHit();
    }
  }

  jumpHit() {
    const otherViewers = evotarsManager.getViewerEvotars();

    for (const id in otherViewers) {
      const other = otherViewers[id];

      if (other) {
        const collider1 = this.getCollider();
        const collider2 = other.getCollider();

        if (
          other != this &&
          checkCollisionDownUp(collider1, collider2, {
            x: this.velocity.x,
            y: this.velocity.y,
          })
        ) {
          if (!other.isDead && !other.state.isImmortal) {
            other.die();
            this.info.addKill();
          }
        }
      }
    }
  }

  update(): void {
    if (this.isDespawned || !this.sprite) {
      return;
    }

    this.landTimer?.tick();
    this.stateTimer?.tick();
    this.scaleTimer?.tick();

    this.fadeTween?.update();
    this.spawnTween?.update();
    this.scaleTween?.update();

    this.deathTimer?.tick();

    this.container.zIndex = this.state.zIndex;

    const collider = this.sprite.data.collider;

    this.name.update({
      name: this.state.name,
      isVisible: !this.state.isAnonymous,
      position: {
        y: -collider.h * this.getScale(),
      },
    });

    this.info.update({
      position: {
        y: this.name.text.position.y - this.name.text.height - 6,
      },
    });

    this.message.update({
      position: {
        y: this.info.containter.position.y - this.info.containter.height - 6,
      },
    });

    this.emoteSpitter.update({
      position: {
        y: this.message.container.position.y - this.message.container.height,
      },
    });

    if (!this.isDead) {
      this.move();
    }

    const colors = Object.fromEntries(
      this.sprite.data.colored.map((layer) => [
        layer,
        this.userState.color ? this.userState.color : this.state.color,
      ]),
    );

    const direction = this.sprite.data.flip ? this.state.direction : 1;

    this.sprite.update({
      color: colors,
      scale: {
        x: direction * this.getScale(),
        y: this.getScale(),
      },
      play: !this.isDashing,
    });

    this.trail.update({
      play: this.isDashing,
    });
  }

  isOnGround(y: number): boolean {
    return y > app.renderer.height;
  }

  addMessage(message: string): void {
    this.message.add(message);
    this.state.isAnonymous = false;
    this.fadeTween?.stop();
    this.fadeTween = undefined; // https://github.com/tweenjs/tween.js/issues/665
    this.container.alpha = 1;
  }

  async spitEmotes(emotes: string[]): Promise<void> {
    for (const emote of emotes) {
      await this.emoteSpitter.add(emote);
    }
  }

  async setAnimationState(
    state: EvotarSpriteTags,
    force = false,
  ): Promise<void> {
    if (this.animationState == state && !force) {
      return;
    }

    this.animationState = state;

    if (this.sprite) {
      this.sprite.setTag(state);
    }
  }
}
