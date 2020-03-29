import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';

export type PendingInput = {
  pressTime: number;
  inputSequenceNumber: number;
  left: boolean;
  shoot: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export type EntityTypes = 'player' | 'wall' | 'shot';

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

  abstract tick(duration: number): void;
}

export class PlayerEntity extends Entity {
  tick(): void {}
  lastProcessedInputSequenceNumber: number = -1;

  pendingInputs: PendingInput[] = [];
  inputSequenceNumber: number = 0;

  constructor(game: Game, entityId: string) {
    super(game, entityId, 'player');
  }

  speed = 200;

  applyInput(input: PendingInput) {
    if (input.shoot) {
      this.game.createEntity('shot', this.x + 30 / 2, this.y);
    }
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
      case 'shot':
        console.log('shot');
        return false;
    }
  }
}

export class WallEntity extends Entity {
  tick(): void {}
  constructor(game: Game, entityId: string) {
    super(game, entityId, 'wall');
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }
}

export class ShotEntity extends Entity {
  constructor(game: Game, entityId: string) {
    super(game, entityId, 'shot');
  }

  start(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.updatePosition();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }

  shotSpeedPerSecond = 150;
  tick(duration: number) {
    this.y -= this.shotSpeedPerSecond * (duration / 1000);
    this.updatePosition();
  }
}
