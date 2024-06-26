import { Point } from '../helpers/types';
import { Text } from 'pixi.js';

export type EvotarNameProps = {
  name: string;
  position: Point;
  isVisible: boolean;
};

export class EvotarName {
  public text: Text = new Text({
    text: undefined,
    style: {
      fontFamily: 'Custom Font',
      fontSize: 18,
      fill: 0xffffff,
      align: 'center',
      stroke: {
        width: 4,
        color: 'black',
        join: 'round',
      },
    },
  });

  constructor() {
    this.text.anchor.set(0.5, 1);
    this.text.zIndex = 100;
  }

  update(props: EvotarNameProps) {
    this.text.text = props.name ?? '';
    this.text.visible = props.isVisible;
    this.text.position.x = props.position.x ?? this.text.position.x;
    this.text.position.y = props.position.y ?? this.text.position.y;
  }
}
