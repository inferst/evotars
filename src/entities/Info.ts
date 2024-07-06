import { Point } from '../helpers/types';
import { Assets, Container, Sprite, Text, TextStyleOptions } from 'pixi.js';

export type EvotarInfoProps = {
  kills: number;
  jumps: number;
};

export type EvotarInfoUpdateProps = {
  position: Point;
};

const style: TextStyleOptions = {
  fontFamily: 'Custom Font',
  fontSize: 14,
  fill: 'white',
  align: 'center',
  stroke: {
    width: 4,
    color: 'black',
    join: 'round',
  },
};

export class EvotarInfo {
  public containter: Container = new Container();

  private killText: Text = new Text({
    text: undefined,
    style,
  });

  private killSprite: Sprite;

  private jumpText: Text = new Text({
    text: undefined,
    style,
  });

  private jumpSprite: Sprite;

  public kills = 0;
  public jumps = 0;

  constructor() {
    this.containter.zIndex = 100;

    this.killSprite = this.createSprite('skull');
    this.killText.anchor.set(0, 0.5);

    this.jumpSprite = this.createSprite('weight');
    this.jumpText.anchor.set(0, 0.5);
  }

  addJumps(count: number) {
    this.jumps += count;
    this.draw();
  }

  addKill() {
    this.kills += 1;
    this.draw();
  }

  useJump() {
    this.jumps -= 1;
    this.draw();
  }

  createSprite(name: string): Sprite {
    const asset = Assets.get(name);
    const sprite = Sprite.from(asset);

    sprite.anchor.set(0, 0.5);
    sprite.scale.set(2, 2);
    sprite.texture.source.scaleMode = 'nearest';

    return sprite;
  }

  draw() {
    const items = [];

    if (this.kills > 0) {
      items.push(this.killSprite);
      items.push(this.killText);

      this.killText.text = this.kills;
    }

    if (this.jumps > 0) {
      items.push(this.jumpSprite);
      items.push(this.jumpText);

      this.jumpText.text = this.jumps;
    }

    const padding = 4;

    const width =
      items.reduce((result, item) => result + item.width, 0) +
      padding * (items.length - 1);

    let prev = -width / 2;

    this.containter.removeChildren();

    for (const item of items) {
      item.position.set(prev, 0);
      prev += item.width + padding;
      this.containter.addChild(item);
    }
  }

  update(props: EvotarInfoUpdateProps) {
    this.containter.position.x = props.position.x ?? this.containter.position.x;
    this.containter.position.y = props.position.y ?? this.containter.position.y;
  }
}
