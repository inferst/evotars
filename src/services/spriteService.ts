import {
  AnimatedSprite,
  Assets,
  SpritesheetData as ISpritesheetData,
  SpritesheetFrameData as ISpritesheetFrameData,
  Spritesheet,
} from 'pixi.js';

export type EvotarSpriteData = {
  name: string;
  collider: Collider;
  size: SpriteSize;
  scale: number;
  flip: boolean;
  colored: string[];
};

export type SpriteLoaderFn = (name: string) => Promise<
  | {
      sprite: SpritesheetData;
      data: EvotarSpriteData;
      image: string;
    }
  | undefined
>;

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

  public async getSpriteData(name: string): Promise<SpriteData | undefined> {
    const sprite = await this.spriteLoaderFn(name);

    if (!sprite) {
      return;
    }

    if (this.sprites[name]) {
      return this.sprites[name];
    }

    const texture = await Assets.load(sprite.image);

    const sheet = new Spritesheet(texture, sprite.sprite);

    await sheet.parse();

    this.sprites[name] = {
      sheet,
      data: {
        ...sprite.data,
        scale: sprite.data.scale ?? 1,
      },
    };

    return this.sprites[name];
  }

  public createAnimatedSprite(
    name: string,
    sheet: Spritesheet<SpritesheetData>,
  ): AnimatedSprite | undefined {
    for (const frameTag of sheet.data.meta.frameTags ?? []) {
      const textures = [];

      for (let i = frameTag.from; i <= frameTag.to; i++) {
        const framekey = i.toString();

        const key = name + '_' + framekey;
        const texture = sheet.textures[key];
        const time = sheet.data.frames[key].duration;

        textures.push({ texture: texture, time: time });
      }

      const sprite = new AnimatedSprite(textures);

      sprite.texture.source.scaleMode = 'nearest';

      return sprite;
    }

    return;
  }

  public getAnimatedSprites(name: string): EvotarAnimatedSprites {
    if (!name) {
      throw Error('Sheet is not defined');
    }

    if (!this.sprites[name]) {
      throw Error('Sprite is not loaded');
    }

    const data = this.sprites[name].data;
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

          const key = data.name + '_' + layer.name + '_' + framekey;
          const texture = sheet.textures[key];
          const time = sheet.data.frames[key].duration;

          textures.push({ texture: texture, time: time });
        }

        const sprite = new AnimatedSprite(textures);

        sprite.texture.source.scaleMode = 'nearest';

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
