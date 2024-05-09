import * as PIXI from 'pixi.js';
import { FIXED_DELTA_TIME } from '../config/constants';
import { Point } from '../helpers/types';
import { EvotarLayerSprites } from '../services/spriteService';

export type EvotarSpriteContainerProps = {
  color: {
    [key in string]?: PIXI.Color;
  };
  scale: Point;
  play: boolean;
};

export class EvotarSpriteContainer {
  public container: PIXI.Container = new PIXI.Container();

  public sprites: EvotarLayerSprites;

  constructor(sprites: EvotarLayerSprites) {
    this.sprites = sprites;

    this.container.sortableChildren = true;

    let zIndex = 0;

    for (const layer in this.sprites) {
      const sprite = this.sprites[layer];
      this.container.addChild(sprite);

      sprite.zIndex = ++zIndex;
      sprite.anchor.set(0.5, 0);
      sprite.autoUpdate = false;
      sprite.play();
    }
  }

  public update(props: EvotarSpriteContainerProps): void {
    for (const layer in this.sprites) {
      const sprite = this.sprites[layer];

      if (props.play) {
        sprite.update(FIXED_DELTA_TIME * 0.06);
      }

      if (props.color) {
        for (const colorLayer in props.color) {
          if (colorLayer == layer) {
            const color = props.color[colorLayer];

            if (color) {
              sprite.alpha = color.alpha;
              sprite.tint = color;
            }
          }
        }
      }

      if (props.scale.x) {
        sprite.animationSpeed = 4 / Math.abs(props.scale.x);
      }
    }

    this.container.scale.set(props.scale.x, props.scale.y);
  }
}
