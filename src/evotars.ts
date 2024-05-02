import { AppOptions, app } from './app';
import { evotarsManager } from './evotarsManager';
import {
  MessageEntity,
  RaidData,
  SettingsEntity,
  TwitchChatterEntity,
  UserActionEntity,
} from './types';

export class Evotars {
  private isRendered = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly options: AppOptions,
  ) {}

  processMessage = (data: MessageEntity) => evotarsManager.processMessage(data);

  processAction = (data: UserActionEntity) =>
    evotarsManager.processAction(data);

  processChatters = (data: TwitchChatterEntity[]) =>
    evotarsManager.processChatters(data);

  processRaid = (data: RaidData) => evotarsManager.processRaid(data);

  updateSettings(data: SettingsEntity) {
    app.updateSettings(data);
  }

  async run() {
    if (this.isRendered) {
      return;
    }

    this.isRendered = true;

    const init = async (): Promise<void> => {
      await app.initialize(this.root, this.options);

      let lastTime = performance.now();
      let lastFrame = -1;

      const maxFps = 60;

      const minElapsedMS = 1000 / maxFps;
      const maxElapsedMS = 100;

      requestAnimationFrame(animate);

      function animate(currentTime = performance.now()): void {
        let elapsedMS = currentTime - lastTime;

        if (elapsedMS > maxElapsedMS) {
          elapsedMS = maxElapsedMS;
        }

        const delta = (currentTime - lastFrame) | 0;

        if (delta > minElapsedMS) {
          lastFrame = currentTime - (delta % minElapsedMS);
          lastTime = currentTime;

          app.update();
        }

        requestAnimationFrame(animate);
      }
    };

    await init();
  }
}
