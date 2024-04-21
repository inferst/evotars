import * as PIXI from 'pixi.js';
import { Evotar } from './entities/Evotar';
import { timers } from './helpers/timer';
import { assetsLoader } from './services/assetsLoader';
import { dudesManager } from './services/evotarsManager';
import { SoundManifest, soundService } from './services/soundService';
import { SettingsEntity } from './types';

export type AppOptions = {
  manifest: PIXI.AssetsManifest;
  sound: SoundManifest;
};

export class App {
  public stage: PIXI.Container = new PIXI.Container();
  public dudes: Record<string, Evotar> = {};

  public chatterIds: string[] = [];

  public settings: SettingsEntity = {};

  public renderer!: PIXI.Renderer;

  public async init(options: AppOptions, element: HTMLElement): Promise<void> {
    await assetsLoader.load(options.manifest);
    soundService.init(options.sound);

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

    dudesManager.subscribe({
      onAdd: (dude: Evotar) => this.stage.addChild(dude.container),
      onDelete: (dude: Evotar) => {
        this.stage.removeChild(dude.container);
        this.stage.removeChild(dude.trail.container);
      },
    });
  }

  public updateSettings(data: SettingsEntity): void {
    this.settings = data;
  }

  public update(): void {
    timers.tick();
    dudesManager.update();

    this.renderer.render(this.stage);
  }
}

export const app = new App();
