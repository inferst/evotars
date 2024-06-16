export type SoundOptions = {
  jump?: {
    src: string;
  };
};

class SoundService {
  assets: { [key: string]: HTMLAudioElement } = {};

  async initialize(options?: SoundOptions) {
    this.assets = Object.fromEntries(
      Array.from(Object.entries(options ?? {})).map(([key, value]) => {
        return [key, new Audio(value.src)];
      }),
    );
  }

  play(name: string) {
    const audio = this.assets[name];

    if (audio) {
      audio.volume = 0.3;
      audio.pause();
      audio.currentTime = 0;
      audio.play();
    }
  }
}

export const soundService = new SoundService();
