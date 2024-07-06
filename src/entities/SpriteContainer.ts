import * as PIXI from 'pixi.js';
import { Point } from '../helpers/types';
import {
  EvotarAnimatedSprites,
  EvotarLayerSprites,
  EvotarSpriteData,
  EvotarSpriteTags,
} from '../services/spriteService';
import { app } from '../app';

export type EvotarSpriteContainerProps = {
  color: {
    [key in string]?: PIXI.Color;
  };
  scale: Point;
  play: boolean;
};

export class EvotarSpriteContainer {
  public container: PIXI.Container = new PIXI.Container();

  private currentTag: string = EvotarSpriteTags.Idle;

  constructor(
    private sprites: EvotarAnimatedSprites,
    public data: EvotarSpriteData,
  ) {
    this.container.pivot.set(0, data.collider.y + data.collider.h);
    this.container.sortableChildren = true;

    let zIndex = 0;

    for (const key in this.sprites) {
      const evotarSprite = this.sprites[key];

      for (const layer in evotarSprite) {
        const sprite = evotarSprite[layer];

        sprite.zIndex = ++zIndex;
        sprite.anchor.set(0.5, 0);
        sprite.autoUpdate = false;
        sprite.play();
      }
    }
  }

  public getLayersByTag(tag: EvotarSpriteTags): EvotarLayerSprites {
    return this.sprites[tag];
  }

  public setTag(tag: EvotarSpriteTags = EvotarSpriteTags.Idle) {
    if (this.currentTag != tag) {
      this.container.removeChildren();
    }

    this.currentTag = tag;

    const current = this.sprites[this.currentTag];

    for (const layer in current) {
      const sprite = current[layer];
      this.container.addChild(sprite);
    }
  }

  public update(props: EvotarSpriteContainerProps): void {
    const current = this.sprites[this.currentTag];

    for (const layer in current) {
      const sprite = current[layer];

      if (props.play) {
        sprite.update(app.ticker);
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
