import {
  AnimatedSprite,
  Assets,
  ISpritesheetData,
  ISpritesheetFrameData,
  SCALE_MODES,
  Spritesheet,
} from 'pixi.js';

export type EvotarSpriteData = {
  collider: Collider;
  size: SpriteSize;
  scale: number;
  flip: boolean;
  colored: string[];
};

export type SpriteLoaderFn = (name: string) => Promise<{
  sprite: SpritesheetData;
  data: EvotarSpriteData;
  image: string;
}>;

export type Collider = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export interface SpritesheetFrameData extends ISpritesheetFrameData {
  duration: number;
}

export interface SpritesheetData extends ISpritesheetData {
  frames: Record<string, SpritesheetFrameData>;
}

export type EvotarLayerSprites = {
  [layer in string]: AnimatedSprite;
};

export type EvotarAnimatedSprites = {
  [tag in string]: EvotarLayerSprites;
};

export enum EvotarSpriteTags {
  Idle = 'Idle',
  Jump = 'Jump',
  Fall = 'Fall',
  Land = 'Land',
  Run = 'Run',
  Die = 'Die',
}

export type FrameTag = {
  from: number;
  name: string;
  to: number;
  direction: string;
};

export type SpriteSize = {
  w: number;
  h: number;
};

export type SpriteData = {
  sheet: Spritesheet<SpritesheetData>;
  data: EvotarSpriteData;
};

export class SpriteService {
  private spriteLoaderFn!: SpriteLoaderFn;

  private sprites: Record<string, SpriteData> = {};

  public initialize(spriteLoaderFn: SpriteLoaderFn) {
    this.spriteLoaderFn = spriteLoaderFn;
  }

  private async loadSpriteData(name: string): Promise<void> {
    if (this.sprites[name]) {
      return;
    }

    const sprite = await this.spriteLoaderFn(name);

    const texture = await Assets.load(sprite.image);

    const sheet = new Spritesheet({
      texture,
      data: sprite.sprite,
    });

    await sheet.parse();

    this.sprites[name] = {
      sheet,
      data: sprite.data,
    };
  }

  public async getSpriteData(name: string): Promise<SpriteData> {
    await this.loadSpriteData(name);

    return this.sprites[name];
  }

  public getAnimatedSprites(name: string): EvotarAnimatedSprites {
    if (!name) {
      throw Error('Sheet is not defined');
    }

    if (!this.sprites[name]) {
      throw Error('Sprite is not loaded');
    }

    const sheet = this.sprites[name].sheet;

    const sprites: EvotarAnimatedSprites = {};

    for (const frameTag of sheet.data.meta.frameTags ?? []) {
      if (!sheet.data.meta.layers) {
        throw Error('Layers are not defined');
      }

      const layers: EvotarLayerSprites = {};

      for (const layer of sheet.data.meta.layers) {
        const textures = [];

        for (let i = frameTag.from; i <= frameTag.to; i++) {
          const framekey = i.toString();

          const key = name + '_' + layer.name + '_' + framekey;
          const texture = sheet.textures[key];
          const time = sheet.data.frames[key].duration;

          textures.push({ texture: texture, time: time });
        }

        const sprite = new AnimatedSprite(textures);

        sprite.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;

        layers[layer.name] = sprite;
      }

      if (frameTag.name) {
        sprites[frameTag.name] = layers;
      }
    }

    return sprites;
  }
}

export const spriteService = new SpriteService();
