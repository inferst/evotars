import { Evotars } from '../src/evotars';
import { delay } from '../src/helpers/delay';
import { SettingsEntity } from '../src/types';
import './styles.css';

const sounds = { jump: { src: '/sounds/jump.mp3' } };
const settings: SettingsEntity = {
  fallingEvotars: true,
  fallingRaiders: true,
};

const root = document.body;

if (root) {
  const evotars = new Evotars(root, {
    font: '/fonts/Rubik-VariableFont_wght.ttf',
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

  await delay(500);

  evotars.processAction({
    name: 'dash',
    id: 1,
    title: 'Jump',
    cooldown: 0,
    description: 'Jump',
    data: {},
    userId: '1',
    info: {
      color: 'pink',
      displayName: 'Evotar',
      sprite: 'dude',
    },
  });

  await delay(500);

  evotars.processMessage({
    message: 'Hello!',
    userId: '1',
    emotes: [
      'https://dudes2.mikedanagam.space/7tv-emotes/emote/60ae4bb30e35477634610fda/4x.gif',
    ],
    info: {
      color: 'pink',
      displayName: 'Evotar',
      sprite: 'dude',
    },
  });

  await delay(1000);

  evotars.processAction({
    name: 'jump',
    id: 1,
    title: 'Jump',
    cooldown: 0,
    description: 'Jump',
    data: {},
    userId: '1',
    info: {
      color: 'pink',
      displayName: 'Evotar',
      sprite: 'dude',
    },
  });

  await delay(500);

  evotars.processMessage({
    message: 'Hello!',
    userId: '1',
    emotes: [
      'https://dudes2.mikedanagam.space/7tv-emotes/emote/60ae4bb30e35477634610fda/4x.gif',
      'https://dudes2.mikedanagam.space/7tv-emotes/emote/60ccf4479f5edeff9938fa77/4x.gif',
      'https://dudes2.mikedanagam.space/7tv-emotes/emote/60aeeb53a564afa26ee82323/4x.gif',
      'https://dudes2.mikedanagam.space/7tv-emotes/emote/62f424b0ea941a22a1f03268/4x.gif',
      'https://dudes2.mikedanagam.space/7tv-emotes/emote/60b056f5b254a5e16b929707/4x.gif',
    ],
    info: {
      color: 'pink',
      displayName: 'Evotar',
      sprite: 'dude',
    },
  });
  await delay(500);
  evotars.processMessage({
    message: 'Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! Hello! ',
    userId: '2',
    emotes: [
      'https://dudes2.mikedanagam.space/7tv-emotes/emote/60ae4bb30e35477634610fda/4x.gif',
    ],
    info: {
      color: 'pink',
      displayName: 'Evotar 2',
      sprite: 'dude',
    },
  });
}
