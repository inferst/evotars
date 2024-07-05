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

  constructor() {
    this.containter.zIndex = 100;

    this.killSprite = this.createSprite('skull');
    this.killText.anchor.set(0, 0.5);

    this.jumpSprite = this.createSprite('weight');
    this.jumpText.anchor.set(0, 0.5);
  }

  createSprite(name: string): Sprite {
    const asset = Assets.get(name);
    const sprite = Sprite.from(asset);
    sprite.anchor.set(0, 0.5);
    sprite.scale.set(2, 2);
    sprite.texture.source.scaleMode = 'nearest';

    return sprite;
  }

  setProps(props: EvotarInfoProps) {
    const items = [];

    if (props.kills > 0) {
      items.push(this.killSprite);
      items.push(this.killText);

      this.killText.text = props.kills;
    }

    if (props.jumps > 0) {
      items.push(this.jumpSprite);
      items.push(this.jumpText);

      this.jumpText.text = props.jumps;
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

  hide() {
    this.containter.visible = false;
  }

  show() {
    this.containter.visible = true;
  }
}
