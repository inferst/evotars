import * as PIXI from 'pixi.js';
import { Evotar } from './entities/Evotar';
import { timers } from './helpers/timer';
import { evotarsManager } from './evotarsManager';
import { SoundOptions, soundService } from './services/soundService';
import { SettingsEntity } from './types';
import { SpriteLoaderFn, spriteService } from './services/spriteService';
import { FIXED_DELTA_TIME } from './config/constants';

export type AppOptions = {
  font?: string;
  sounds?: SoundOptions;
  spriteLoaderFn: SpriteLoaderFn;
};

export class App {
  public stage: PIXI.Container = new PIXI.Container();
  public evotars: Record<string, Evotar> = {};

  public chatterIds: string[] = [];

  public settings: SettingsEntity = {};

  public renderer!: PIXI.Renderer;

  public ticker!: PIXI.Ticker;

  public async initialize(
    element: HTMLElement,
    options: AppOptions,
  ): Promise<void> {
    spriteService.initialize(options.spriteLoaderFn);
    soundService.initialize(options.sounds);

    if (options.font) {
      await PIXI.Assets.load({
        src: options.font,
        data: { family: 'Custom Font' },
      });
    }

    PIXI.Assets.add({ alias: 'poof', src: '/poof.json' });
    PIXI.Assets.add({ alias: 'skull', src: '/skull.png' });
    PIXI.Assets.add({ alias: 'weight', src: '/weight.png' });

    await PIXI.Assets.load(['death', 'skull', 'weight', 'poof']);

    this.ticker = new PIXI.Ticker();
    this.ticker.deltaTime = FIXED_DELTA_TIME * 0.06;

    this.renderer = await PIXI.autoDetectRenderer({
      preference: 'webgl',
    });

    await this.renderer.init({
      width: element.clientWidth,
      height: element.clientHeight,
      backgroundAlpha: 0,
    });

    element.appendChild(this.renderer.canvas);

    window.onresize = (): void => {
      this.renderer.resize(element.clientWidth, element.clientHeight);
    };

    this.stage.sortableChildren = true;

    evotarsManager.subscribe({
      onAdd: (evotar: Evotar) => this.stage.addChild(evotar.container),
      onDelete: (evotar: Evotar) => {
        this.stage.removeChild(evotar.container);
        this.stage.removeChild(evotar.trail.container);
      },
    });
  }

  public updateSettings(data: SettingsEntity): void {
    this.settings = data;
  }

  public update(): void {
    timers.tick();
    evotarsManager.update();

    this.renderer.render(this.stage);
  }
}

export const app = new App();
