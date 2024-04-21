import * as PIXI from 'pixi.js';
import { FIXED_DELTA_TIME } from '../config/constants';
import { Point } from '../helpers/types';
import {
  EvotarLayerAnimatedSprite,
  EvotarSpriteLayers,
} from '../services/spriteProvider';
import { DEFAULT_EVOTAR_SCALE } from './Evotar';

export type EvotarSpriteContainerProps = {
  color: {
    [key in EvotarSpriteLayers]?: PIXI.Color;
  };
  scale: Point;
  play: boolean;
};

export class EvotarSpriteContainer {
  public container: PIXI.Container = new PIXI.Container();

  public sprites: EvotarLayerAnimatedSprite[];

  constructor(sprites: EvotarLayerAnimatedSprite[]) {
    this.sprites = sprites;

    this.container.sortableChildren = true;

    let zIndex = 0;

    for (const layer of this.sprites) {
      const sprite = layer.sprite;
      this.container.addChild(sprite);

      sprite.zIndex = ++zIndex;
      sprite.anchor.set(0.5, 0.5);
      sprite.autoUpdate = false;
      sprite.play();
    }
  }

  public update(props: EvotarSpriteContainerProps): void {
    for (const layer of this.sprites) {
      if (props.play) {
        layer.sprite.update(FIXED_DELTA_TIME * 0.06);
      }

      if (props.color) {
        for (const colorLayer in props.color) {
          if (colorLayer == layer.layer) {
            const color = props.color[colorLayer];

            if (color) {
              layer.sprite.alpha = color.alpha;
              layer.sprite.tint = color;
            }
          }
        }
      }

      if (props.scale.x) {
        layer.sprite.animationSpeed =
          DEFAULT_EVOTAR_SCALE / Math.abs(props.scale.x);
      }
    }

    this.container.scale.set(props.scale.x, props.scale.y);
  }
}
