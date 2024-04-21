import { Evotars } from '../src/evotars';
import { SettingsEntity } from '../src/types';
import './styles.css';

const manifest = {
  bundles: [
    {
      name: 'main',
      assets: [
        {
          alias: 'dude',
          src: '/sprites/dude/dude.json',
        },
        {
          alias: 'sith',
          src: '/sprites/sith/sith.json',
        },
        {
          alias: 'agent',
          src: '/sprites/agent/agent.json',
        },
        {
          alias: 'girl',
          src: '/sprites/girl/girl.json',
        },
        {
          alias: 'senior',
          src: '/sprites/senior/senior.json',
        },
        {
          alias: 'cat',
          src: '/sprites/cat/cat.json',
        },
        {
          alias: 'nerd',
          src: '/sprites/nerd/nerd.json',
        },
      ],
    },
    {
      name: 'fonts',
      assets: [
        {
          alias: 'Rubik',
          src: '/fonts/Rubik.ttf',
        },
      ],
    },
  ],
};

const sound = { jump: '/sounds/jump.mp3' };
const settings: SettingsEntity = {
  fallingEvotars: true,
};

const root = document.getElementById('root');

if (root) {
  const dudes = new Evotars(root);
  await dudes.run({ manifest, sound });
  dudes.updateSettings(settings);

  setTimeout(() => {
    dudes.processMessage({
      message: 'Hello!',
      userId: '1',
      emotes: [],
      info: {
        color: 'pink',
        displayName: 'Evotar',
      },
    });
  }, 500);
}
