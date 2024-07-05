import { Point } from './helpers/types';
import { Collider } from './services/spriteService';

export const checkCollision = (
  collider1: Collider,
  collider2: Collider,
): boolean => {
  return (
    collider1.x < collider2.x + collider2.w &&
    collider1.x + collider1.w > collider2.x &&
    collider1.y < collider2.y + collider2.h &&
    collider1.y + collider1.h > collider2.y
  );
};

export const checkCollisionDownUp = (
  collider1: Collider,
  collider2: Collider,
  move: Point,
) => {
  const moved: Collider = {
    ...collider1,
    x: collider1.x + (move.x ?? 0),
    y: collider1.y + (move.y ?? 0),
  };

  const collided = checkCollision(moved, collider2);

  if (collided) {
    return (
      collider1.y + collider1.h < collider2.y &&
      moved.y + moved.h >= collider2.y
    );
  }

  return false;
};
