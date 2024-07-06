import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Point } from '../helpers/types';
import { SimpleObject } from '../types';
import { stageSpriteContainer } from '../stageSpriteContainer';
import { app } from '../app';

export type TombStoneProps = {
  position: Point;
  scale: number;
};

const SPRITE_SCALE = 4;

export class TombStone implements SimpleObject {
  public container: PIXI.Container = new PIXI.Container();
  private sprite: PIXI.Sprite;

  private gravity = 0.2;

  private velocity: PIXI.PointData = {
    x: 0,
    y: 0,
  };

  fadeTween?: TWEEN.Tween<PIXI.Container>;

  constructor(public readonly id: string) {
    const name = Math.random() > 0.5 ? 'rip1' : 'rip2';
    const asset = PIXI.Assets.get(name);
    this.sprite = PIXI.Sprite.from(asset);
  }

  isOnGround(y: number): boolean {
    return y > app.renderer.height;
  }

  public update() {
    const position = {
      x: this.container.position.x,
      y: this.container.position.y,
    };

    this.velocity.y = this.velocity.y + this.gravity;

    position.x += this.velocity.x;
    position.y += this.velocity.y;

    if (this.isOnGround(position.y)) {
      this.velocity.y = 0;
      this.velocity.x = 0;

      position.y = app.renderer.height;
    }

    this.container.position.set(position.x, position.y);
  }

  public despawn(smooth = false, onComplete = () => {}) {
    if (!smooth) {
      const position = {
        x: this.container.position.x,
        y: this.container.position.y - 8 * this.container.scale.x,
      };

      stageSpriteContainer.play('poof', position, this.container.scale.x);
      onComplete();
    } else {
      this.fadeTween = new TWEEN.Tween(this.container)
        .to({ alpha: 0 }, 1000)
        .onComplete(onComplete)
        .start();
    }
  }

  public spawn(props: TombStoneProps) {
    this.container.removeChildren();
    this.container.addChild(this.sprite);

    this.container.position.set(
      props.position.x,
      (props.position.y ?? 0) + (this.sprite.height / 2) * props.scale,
    );

    this.container.scale.set(SPRITE_SCALE);

    this.sprite.anchor.set(0.5, 1);
    this.sprite.texture.source.scaleMode = 'nearest';

    stageSpriteContainer.play(
      'poof',
      {
        x: props.position.x,
        y: props.position.y,
      },
      props.scale,
    );
  }
}
