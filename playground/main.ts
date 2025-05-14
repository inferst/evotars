import { Evotars } from '../src/evotars';
import { delay } from '../src/helpers/delay';
import { SettingsEntity } from '../src/types';
import './styles.css';

const raiderInfo = {
  sprite: 'sith',
  color: 'green',
  displayName: 'Raider',
};

const raiderMessage = (message: string) => ({
  message,
  userId: 'raider',
  emotes: [],
  info: raiderInfo,
});

const settings: SettingsEntity = {
  fallingEvotars: true,
  fallingRaiders: true,
  maxEvotars: 2,
};

const root = document.body;

if (root) {
  const evotars = new Evotars(root, {
    font: '/fonts/Rubik-VariableFont_wght.ttf',
    sounds: { jump: { src: '/sounds/jump.mp3' } },
    assets: {
      poof: '/client/poof.json',
      rip1: '/client/rip1.png',
      rip2: '/client/rip2.png',
      skull: '/client/skull.png',
      weight: '/client/weight.png',
    },
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

  await delay(5000);

  evotars.processRaid({
    viewers: {
      count: 10,
      sprite: 'agent',
    },
    broadcaster: {
      id: 'raider',
      info: {
        sprite: 'dude',
        color: 'green',
        displayName: 'MikeRime',
      },
    },
  });

  evotars.processMessage(raiderMessage('RAID!!!'));

  const evotar = await evotars.manager.spawnViewerEvotar(
    'test',
    {
      name: 'Test',
      sprite: 'dude',
      scale: 4,
      direction: 1,
    },
    {
      positionX: 0.65,
    },
  );

  evotar.addJumpHit(100);

  await delay(1000);

  await evotars.manager.spawnViewerEvotar(
    'test2',
    {
      name: 'Test2',
      sprite: 'dude',
      scale: 4,
      direction: 1,
    },
    {},
  );

  await delay(1000);

  await evotars.manager.spawnViewerEvotar(
    'test3',
    {
      name: 'Test3',
      sprite: 'dude',
      scale: 4,
      direction: 1,
    },
    {},
  );

  await delay(1000);

  await evotars.manager.spawnViewerEvotar(
    'test4',
    {
      name: 'Test4',
      sprite: 'dude',
      scale: 4,
      direction: 1,
    },
    {},
  );

  while (true) {
    await delay(5000);

    evotar.jump();
  }
}
