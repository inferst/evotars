import * as PIXI from 'pixi.js';
import { Point } from '../helpers/types';
import { Timer } from '../helpers/timer';
import { FIXED_DELTA_TIME } from '../config/constants';

export type DudeEmoteSpitterProps = {
  position: Point;
};

export class DudeEmoteSpitter {
  public container: PIXI.Container = new PIXI.Container();

  private emotes: PIXI.Sprite[] = [];

  private moveSpeed = 50;
  private alphaSpeed = 1;
  private scaleSpeed = 0.5;

  private timer?: Timer;

  public add(url: string): void {
    const sprite = PIXI.Sprite.from(url);
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(0, 0);
    this.emotes.push(sprite);
  }

  public update(props: DudeEmoteSpitterProps): void {
    this.timer?.tick();

    if (!this.timer || this.timer.isCompleted) {
      if (this.emotes.length > 0) {
        this.timer = new Timer(2000, () => {
          const sprite = this.emotes.shift();

          if (sprite) {
            this.container.addChild(sprite);
          }
        });
      }
    }

    this.container.position.x = props.position.x ?? this.container.position.x;
    this.container.position.y = props.position.y ?? this.container.position.y;

    for (const child of this.container.children) {
      child.position.y -= (FIXED_DELTA_TIME * this.moveSpeed) / 1000;
      child.scale.x += (FIXED_DELTA_TIME * this.scaleSpeed) / 1000;
      child.scale.y += (FIXED_DELTA_TIME * this.scaleSpeed) / 1000;

      if (child.scale.x > 1) {
        child.alpha -= (FIXED_DELTA_TIME * this.alphaSpeed) / 1000;
      }

      if (child.alpha <= 0) {
        this.container.removeChild(child);
      }
    }
  }
}
