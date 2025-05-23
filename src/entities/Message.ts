import { Timer } from '../helpers/timer';
import { Point } from '../helpers/types';
import { Tween } from '@tweenjs/tween.js';
import * as PIXI from 'pixi.js';

export type EvotarMesageProps = {
  position: Point;
};

export class EvotarMessage {
  public container: PIXI.Container = new PIXI.Container();
  public animated: PIXI.Container = new PIXI.Container();

  private text: PIXI.Text = new PIXI.Text({
    text: undefined,
    style: {
      fontFamily: 'Custom Font',
      fontSize: 20,
      fill: 0x222222,
      align: 'left',
      breakWords: true,
      wordWrap: true,
      wordWrapWidth: 200,
    },
  });

  private padding = 10;
  private borderRadius = 10;
  private boxColor = 0xeeeeee;
  private boxBorderColor = 0x222222;

  private fadeShift = 10;

  private isChecking = true;

  private showTween?: Tween<PIXI.Container>;
  private hideTween?: Tween<PIXI.Container>;

  private timer?: Timer;

  constructor(private beforeShow: () => void) {
    this.container.addChild(this.animated);

    this.text.anchor.set(0.5, 1);
    this.text.position.set(0, -this.padding);
  }

  private trim(text: PIXI.Text): string {
    const metrics = PIXI.CanvasTextMetrics.measureText(text.text, text.style);

    return metrics.lines.length > 4
      ? metrics.lines.slice(0, 4).join(' ').slice(0, -3) + '...'
      : text.text;
  }

  public update(props: EvotarMesageProps): void {
    this.timer?.tick();

    this.showTween?.update();
    this.hideTween?.update();

    this.container.position.x = props.position.x ?? this.container.position.x;
    this.container.position.y = props.position.y ?? this.container.position.y;

    const isAnimationPlaying =
      this.showTween?.isPlaying() || this.hideTween?.isPlaying();

    if (!this.isChecking && !isAnimationPlaying && this.timer) {
      this.animated.position.y = Math.sin(this.timer.current * 0.0025) * 4 - 2;
    }
  }

  public add(message: string): void {
    this.isChecking = false;

    this.hideTween?.stop();
    this.showTween?.stop();

    if (message) {
      this.beforeShow();
      this.show(message);
    }
  }

  private drawBox(text: PIXI.Text) {
    const roundedRect = {
      x: text.x - this.padding - text.width * text.anchor.x,
      y: text.y - this.padding - text.height * text.anchor.y,
      w: text.width + this.padding * 2,
      h: text.height + this.padding * 2,
    };

    const tailWidth = 20;
    const tailHeight = 5;

    const box = new PIXI.Graphics();

    box.moveTo(roundedRect.x + this.borderRadius, roundedRect.y);
    box.quadraticCurveTo(
      roundedRect.x,
      roundedRect.y,
      roundedRect.x,
      roundedRect.y + this.borderRadius,
      5,
    );
    box.lineTo(
      roundedRect.x,
      roundedRect.y + roundedRect.h - this.borderRadius,
    );
    box.quadraticCurveTo(
      roundedRect.x,
      roundedRect.y + roundedRect.h,
      roundedRect.x + this.borderRadius,
      roundedRect.y + roundedRect.h,
      5,
    );
    box.lineTo(
      roundedRect.x + roundedRect.w / 2 - tailWidth / 2,
      roundedRect.y + roundedRect.h,
    );
    box.lineTo(
      roundedRect.x + roundedRect.w / 2,
      roundedRect.y + roundedRect.h + tailHeight,
    );
    box.lineTo(
      roundedRect.x + roundedRect.w / 2 + tailWidth / 2,
      roundedRect.y + roundedRect.h,
    );
    box.lineTo(
      roundedRect.x + roundedRect.w - this.borderRadius,
      roundedRect.y + roundedRect.h,
    );
    box.quadraticCurveTo(
      roundedRect.x + roundedRect.w,
      roundedRect.y + roundedRect.h,
      roundedRect.x + roundedRect.w,
      roundedRect.y + roundedRect.h - this.borderRadius,
      5,
    );
    box.lineTo(
      roundedRect.x + roundedRect.w,
      roundedRect.y + this.borderRadius,
    );
    box.quadraticCurveTo(
      roundedRect.x + roundedRect.w,
      roundedRect.y,
      roundedRect.x + roundedRect.w - this.borderRadius,
      roundedRect.y,
      5,
    );
    box.lineTo(roundedRect.x + this.borderRadius, roundedRect.y);

    box.fill({
      color: this.boxColor,
    });

    box.stroke({
      color: this.boxBorderColor,
      width: 2,
    });

    return box;
  }

  private show(message: string): void {
    this.text.text = message;
    this.text.text = this.trim(this.text);

    this.animated.alpha = 0;
    this.animated.position.y = this.fadeShift;

    const box = this.drawBox(this.text);

    this.animated.removeChildren();
    this.animated.addChild(box, this.text);

    const showProps = {
      alpha: 1,
      y: this.animated.y - this.fadeShift,
    };

    const hideProps = {
      alpha: 0,
      y: this.animated.y + this.fadeShift,
    };

    this.hideTween = new Tween(this.animated)
      .to(hideProps, 500)
      .onComplete(() => {
        this.isChecking = true;
      });

    this.showTween = new Tween(this.animated)
      .to(showProps, 500)
      .onComplete(() => {
        this.timer = new Timer(10000, () => {
          this.hideTween?.start();
        });
      });

    this.showTween.start();
  }
}
