import { Evotars } from '../src/evotars';
import { delay } from '../src/helpers/delay';
import { SettingsEntity } from '../src/types';
import './styles.css';

const settings: SettingsEntity = {
  fallingEvotars: true,
  fallingRaiders: true,
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

  // for (let i = 0; i < 100; i++) {
  //   await delay(50);
  //   await evotars.manager.spawnViewerEvotar(
  //     'evotar' + i,
  //     {
  //       name: 'Evotar' + i,
  //       sprite: 'dude',
  //       // scale: 2,
  //     },
  //     {
  //       // positionX: 0.5,
  //     },
  //   );
  // }

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

  while (true) {
    await delay(5000);

    evotar.jump();
  }
}
