import * as PIXI from 'pixi.js';
import { Point } from './helpers/types';
import { spriteService } from './services/spriteService';
import { app } from './app';

export type EvotarOtherTags = 'poof';

export class StageSpriteContainer {
  public play(tag: EvotarOtherTags, position: Point, scale: number) {
    const sprite = PIXI.Assets.get(tag);
    const animatedSprite = spriteService.createAnimatedSprite(tag, sprite);

    if (animatedSprite) {
      app.stage.addChild(animatedSprite);

      animatedSprite.zIndex = 1000;
      animatedSprite.scale.set(scale, scale);
      animatedSprite.position.set(position.x, position.y);
      animatedSprite.anchor.set(0.5, 0.5);
      animatedSprite.loop = false;
      animatedSprite.texture.source.scaleMode = 'nearest';

      animatedSprite.play();
      animatedSprite.onComplete = () => {
        app.stage.removeChild(animatedSprite);
      };
    }
  }
}

export const stageSpriteContainer = new StageSpriteContainer();
