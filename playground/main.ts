import { Evotars } from '../src/evotars';
import { SettingsEntity } from '../src/types';
import './styles.css';

const sounds = { jump: { src: '/sounds/jump.mp3' } };
const settings: SettingsEntity = {
  fallingEvotars: true,
};

const root = document.body;

if (root) {
  const evotars = new Evotars(root, {
    sounds,
    spriteLoaderFn: async (name: string) => {
      const path = '/evotars/' + name + '/';
      const sprite = await fetch(path + 'sprite.json');
      const spriteJson = await sprite.json();
      const data = await fetch(path + 'data.json');
      const dataJson = await data.json();

      return {
        data: dataJson,
        image: path + 'sprite.png',
        sprite: spriteJson,
      };
    },
  });

  await evotars.run();
  evotars.updateSettings(settings);

  setTimeout(() => {
    evotars.processMessage({
      message: 'Hello!',
      userId: '1',
      emotes: [],
      info: {
        color: 'pink',
        displayName: 'Evotar',
        sprite: 'dude',
      },
    });
  }, 500);
}
