import {Collisions, Result} from 'collisions';
import {Entity} from '../entities/entity';

export class Game {
  entities: Entity[] = [];
  collisionEngine: Collisions;
  readonly collisionResult: Result;

  constructor() {
    this.collisionEngine = new Collisions();
    this.collisionResult = this.collisionEngine.createResult();
  }

  protected checkCollisions() {
    this.collisionEngine.update();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.checkCollisions();
    }
  }
}
