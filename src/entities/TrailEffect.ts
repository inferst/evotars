import * as PIXI from 'pixi.js';
import { app } from '../app';
import { Timer } from '../helpers/timer';
import { EvotarSpriteContainer } from './SpriteContainer';

export type EvotarTrailEffectProps = {
  play: boolean;
};

export class EvotarTrailEffect {
  public container: PIXI.Container = new PIXI.Container();

  private timer?: Timer;

  private sprite?: EvotarSpriteContainer;

  private opacityStep = 0.1;

  private shadowStep = 50;

  constructor() {
    app.stage.addChild(this.container);
    this.container.zIndex = -100;
  }

  public setSprite(sprite: EvotarSpriteContainer) {
    this.sprite = sprite;
  }

  public update(props: EvotarTrailEffectProps): void {
    for (const child of this.container.children) {
      if (child.alpha > 0) {
        child.alpha = child.alpha - this.opacityStep;
      }
    }

    if (this.timer && !this.timer.isCompleted) {
      this.timer.tick();
    } else if (props.play) {
      this.timer = new Timer(this.shadowStep);

      const container = new PIXI.Container();

      if (this.sprite) {
        for (const layer in this.sprite.sprites) {
          const sprite = this.sprite.sprites[layer];
          const texture = sprite.texture;
          const trailSprite = new PIXI.Sprite(texture);

          trailSprite.anchor.set(0.5, 0);
          trailSprite.alpha = sprite.alpha;
          trailSprite.tint = sprite.tint;

          container.addChild(trailSprite);

          container.scale.set(
            this.sprite.container.scale.x,
            this.sprite.container.scale.y,
          );

          container.pivot.set(
            this.sprite.container.pivot.x,
            this.sprite.container.pivot.y,
          );

          const globalPosition = this.sprite.container.getGlobalPosition();
          container.position.set(globalPosition.x, globalPosition.y);
        }
      }

      this.container.addChild(container);
    }
  }
}
