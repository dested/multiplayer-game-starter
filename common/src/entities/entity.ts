import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';

export type PendingInput = {
  pressTime: number;
  inputSequenceNumber: number;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export type EntityTypes = 'player' | 'wall';

export abstract class Entity {
  polygon?: Polygon;

  x: number = 0;
  y: number = 0;
  positionBuffer: {time: number; x: number; y: number}[] = [];
  constructor(protected game: Game, public entityId: string, public type: EntityTypes) {
    // todo this should go in the implementing class
    const w = 30;
    const h = 30;
    this.polygon = new Polygon(this.x, this.y, [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  updatePosition() {
    if (!this.polygon) {
      return;
    }
    this.polygon.x = this.x;
    this.polygon.y = this.y;
  }

  destroy() {
    if (this.polygon) {
      this.game.collisionEngine.remove(this.polygon!);
      this.polygon = undefined;
    }
  }

  abstract collide(otherEntity: Entity, collisionResult: Result): boolean;

  checkCollisions() {
    if (!this.polygon) {
      return;
    }
    const potentials = this.polygon.potentials();
    for (const body of potentials) {
      if (this.polygon && this.polygon.collides(body, this.game.collisionResult)) {
        const collided = this.collide(body.entity, this.game.collisionResult);
        if (collided) {
          return true;
        }
      }
    }
    return false;
  }
}

export class PlayerEntity extends Entity {
  lastProcessedInputSequenceNumber: number = -1;

  pendingInputs: PendingInput[] = [];
  inputSequenceNumber: number = 0;

  constructor(game: Game, entityId: string) {
    super(game, entityId, 'player');
  }

  speed = 200;

  applyInput(input: PendingInput) {
    if (input.left) {
      this.x -= input.pressTime * this.speed;
    }
    if (input.right) {
      this.x += input.pressTime * this.speed;
    }
    if (input.up) {
      this.y -= input.pressTime * this.speed;
    }
    if (input.down) {
      this.y += input.pressTime * this.speed;
    }
    this.updatePosition();
  }

  destroy(): void {
    super.destroy();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    switch (otherEntity.type) {
      case 'player':
        return false;
      case 'wall':
        this.x -= collisionResult.overlap * collisionResult.overlap_x;
        this.y -= collisionResult.overlap * collisionResult.overlap_y;
        this.updatePosition();
        return true;
    }
  }
}

export class WallEntity extends Entity {
  constructor(game: Game, entityId: string) {
    super(game, entityId, 'wall');
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }
}
