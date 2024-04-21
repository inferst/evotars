import * as TWEEN from '@tweenjs/tween.js';
import * as PIXI from 'pixi.js';
import { app } from '../app';
import { SpriteConfig } from '../config/config';
import { FIXED_DELTA_TIME } from '../config/constants';
import { Timer } from '../helpers/timer';
import { dudesManager } from '../services/evotarsManager';
import { soundService } from '../services/soundService';
import {
  EvotarSpriteLayers,
  EvotarSpriteTags,
  EvotarTagAnimatedSprites,
  spriteProvider,
} from '../services/spriteProvider';
import { EvotarEmoteSpitter } from './EmoteSpitter';
import { EvotarMessage } from './Message';
import { EvotarName } from './Name';
import { EvotarSpriteContainer } from './SpriteContainer';
import { EvotarTrailEffect } from './TrailEffect';

export type EvotarProps = {
  name?: string;
  sprite?: SpriteConfig;
  color?: PIXI.Color;
  direction?: number;
  scale?: number;
  isAnonymous?: boolean;
  zIndex?: number;
};

export type EvotarSpawnProps = {
  isFalling?: boolean;
  positionX?: number;
  onComplete?: () => void;
};

export type EvotarDepawnProps = {
  onComplete?: () => void;
};

type EvotarState = Required<EvotarProps>;

type UserProps = {
  color?: PIXI.Color;
};

export const DEFAULT_DUDE_SCALE = 4;

export class Evotar {
  public container: PIXI.Container = new PIXI.Container();

  private userState: UserProps = {};

  private state: EvotarState = {
    name: '',
    sprite: {
      name: 'dude',
      w: 32,
      h: 32,
      collider: {
        x: 8,
        y: 7,
        w: 16,
        h: 18,
      },
      pivot: {
        x: 0,
        y: 9,
      },
    },
    color: new PIXI.Color('#969696'),
    direction: 1,
    scale: DEFAULT_DUDE_SCALE,
    isAnonymous: false,
    zIndex: 0,
  };

  private animationState?: EvotarSpriteTags;

  // TODO: Refactor sprite initializing, move logic to separate file
  private sprite?: EvotarSpriteContainer;

  private tagSprites: EvotarTagAnimatedSprites =
    spriteProvider.createTagAnimatedSprites(this.state.sprite.name);

  public trail: EvotarTrailEffect = new EvotarTrailEffect();

  private name: EvotarName = new EvotarName();

  private message: EvotarMessage = new EvotarMessage(() => {
    this.state.zIndex = dudesManager.zIndexEvotarMax(this.container.zIndex);
  });

  private emoteSpitter: EvotarEmoteSpitter = new EvotarEmoteSpitter();

  private velocity: PIXI.IPointData = {
    x: 0,
    y: 0,
  };

  private runSpeed = 0.05;

  private gravity = 0.2;

  private dashAcc = 3;

  private isJumping = false;

  private isDashing = false;

  private isDespawned = false;

  landTimer?: Timer;

  stateTimer?: Timer;

  scaleTimer?: Timer;

  spawnTween?: TWEEN.Tween<PIXI.Container>;

  fadeTween?: TWEEN.Tween<PIXI.Container>;

  scaleTween?: TWEEN.Tween<Evotar>;

  constructor(props: EvotarProps = {}) {
    this.container.addChild(this.name.text);
    this.container.addChild(this.emoteSpitter.container);
    this.container.addChild(this.message.container);

    void this.setAnimationState(EvotarSpriteTags.Idle);

    if (props.sprite) {
      this.setSprite(props.sprite);
    }

    this.state = { ...this.state, ...props };

    this.stateTimer = new Timer(5000, () => {
      if (!this.isJumping) {
        this.setAnimationState(EvotarSpriteTags.Run);
      }
    });
  }

  spawn(props: EvotarSpawnProps = { isFalling: false }): void {
    const collider = this.state.sprite.collider;
    const fallingStartY = -(collider.y + collider.h - this.state.sprite.h / 2);
    const spawnY = props.isFalling ? fallingStartY : app.renderer.height;
    const spriteWidth = this.state.sprite.w * this.state.scale;

    const x =
      props.positionX != undefined
        ? props.positionX * app.renderer.width
        : Math.random() * (app.renderer.width - spriteWidth) + spriteWidth / 2;
    const y = spawnY * this.state.scale;

    this.container.x = x;
    this.container.y = y;

    this.state.direction = Math.random() > 0.5 ? 1 : -1;

    if (!props.isFalling) {
      const zIndex = dudesManager.zIndexEvotarMin(this.container.zIndex);

      this.state.zIndex = zIndex;
      this.container.alpha = 0;

      this.spawnTween = new TWEEN.Tween(this.container)
        .to({ alpha: 1 }, 500)
        .onComplete(props.onComplete)
        .start();
    }
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

  scale(options: { value: number; duration: number; cooldown: number }): void {
    if (this.scaleTween && this.scaleTween.isPlaying()) {
      return;
    }

    if (this.scaleTimer && !this.scaleTimer.isCompleted) {
      return;
    }

    this.scaleTween = new TWEEN.Tween(this)
      .to({ state: { scale: DEFAULT_DUDE_SCALE * (options.value ?? 2) } }, 2000)
      .onComplete(() => {
        this.scaleTimer = new Timer((options.duration ?? 10) * 1000, () => {
          this.scaleTween = new TWEEN.Tween(this)
            .to({ state: { scale: DEFAULT_DUDE_SCALE } }, 2000)
            .start();
        });
      })
      .start();
  }

  jump(options: {
    velocityX: number;
    velocityY: number;
    cooldown: number;
  }): void {
    if (this.isDespawned) {
      return;
    }

    if (!this.isJumping) {
      this.isJumping = true;

      this.velocity.x = this.state.direction * (options.velocityX ?? 3.5);
      this.velocity.y = options.velocityY ?? -8;

      this.setAnimationState(EvotarSpriteTags.Jump);

      soundService.play('jump');
    }
  }

  dash(options: { force: number; cooldown: number }): void {
    if (this.isDespawned) {
      return;
    }

    if (!this.isDashing) {
      this.isDashing = true;
      this.velocity.x = this.state.direction * (options.force ?? 14);
    }
  }

  setSprite(sprite: SpriteConfig) {
    if (sprite.name && sprite.name != this.state.sprite.name) {
      this.tagSprites = spriteProvider.createTagAnimatedSprites(sprite.name);

      if (this.animationState) {
        this.setAnimationState(this.animationState, true);
      }
    }
  }

  setProps(props: EvotarProps) {
    if (props.sprite) {
      this.setSprite(props.sprite);
    }

    this.state = { ...this.state, ...props };
  }

  setUserProps(props: UserProps) {
    this.userState = { ...this.userState, ...props };
  }

  private move() {
    const collider = this.state.sprite.collider;

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
          });
        }
      }

      if (this.velocity.y > 0) {
        this.setAnimationState(EvotarSpriteTags.Fall);
      }
    }

    if (this.animationState != EvotarSpriteTags.Idle || this.isDashing) {
      const halfSpriteWidth = (collider.w / 2) * this.state.scale;

      const left = this.container.x - halfSpriteWidth < 0;
      const right = this.container.x + halfSpriteWidth > app.renderer.width;

      if (left || right) {
        this.state.direction = -this.state.direction;
        this.velocity.x = -this.velocity.x;

        if (left) {
          position.x = halfSpriteWidth;
        }

        if (right) {
          position.x = app.renderer.width - halfSpriteWidth;
        }
      }
    }

    this.container.position.set(position.x, position.y);
  }

  update(): void {
    if (this.isDespawned) {
      return;
    }

    this.landTimer?.tick();
    this.stateTimer?.tick();
    this.scaleTimer?.tick();

    this.fadeTween?.update();
    this.spawnTween?.update();
    this.scaleTween?.update();

    this.container.zIndex = this.state.zIndex;

    const collider = this.state.sprite.collider;

    this.name.update({
      name: this.state.name,
      isVisible: !this.state.isAnonymous,
      position: {
        y:
          -(this.state.sprite.h / 2 - collider.y + this.state.sprite.pivot.y) *
          this.state.scale,
      },
    });

    this.message.update({
      position: {
        y: this.name.text.position.y - this.name.text.height - 6,
      },
    });

    this.emoteSpitter.update({
      position: {
        y: this.message.container.position.y - this.message.container.height,
      },
    });

    this.move();

    if (this.sprite) {
      this.sprite.update({
        color: {
          [EvotarSpriteLayers.Body]: this.userState.color
            ? this.userState.color
            : this.state.color,
        },
        scale: {
          x: this.state.direction * this.state.scale,
          y: this.state.scale,
        },
        play: !this.isDashing,
      });
    }

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

  spitEmotes(emotes: string[]): void {
    for (const emote of emotes) {
      this.emoteSpitter.add(emote);
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
      this.container.removeChild(this.sprite.container);
    }

    // TODO: Refactor sprite initializing, move logic to separate file
    const layerAnimatedSprites = this.tagSprites[this.animationState];

    this.sprite = new EvotarSpriteContainer(layerAnimatedSprites);

    this.trail.setSprite(this.sprite);

    this.sprite.container.pivot.set(
      this.state.sprite.pivot.x,
      this.state.sprite.pivot.y,
    );

    this.container.addChild(this.sprite.container);
  }
}
