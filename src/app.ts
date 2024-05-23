import * as PIXI from 'pixi.js';
import { Evotar } from './entities/Evotar';
import { timers } from './helpers/timer';
import { evotarsManager } from './evotarsManager';
import { SoundOptions, soundService } from './services/soundService';
import { SettingsEntity } from './types';
import { SpriteLoaderFn, spriteService } from './services/spriteService';

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

  public font?: string;

  public async initialize(
    element: HTMLElement,
    options: AppOptions,
  ): Promise<void> {
    this.font = options.font;

    spriteService.initialize(options.spriteLoaderFn);
    soundService.initialize(options.sounds);

    this.renderer = new PIXI.Renderer({
      width: element.clientWidth,
      height: element.clientHeight,
      backgroundAlpha: 0,
    });

    element.appendChild(this.renderer.view as HTMLCanvasElement);

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
