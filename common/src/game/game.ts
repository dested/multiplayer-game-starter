import {Collisions, Result} from 'collisions';
import {Entity, ShotEntity} from '../entities/entity';
import {uuid} from '../utils/uuid';

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

  createEntity(type: 'shot', x: number, y: number) {
    switch (type) {
      case 'shot':
        const shotEntity = new ShotEntity(this, uuid());
        shotEntity.start(x, y);
        this.entities.push(shotEntity);
        break;
    }
  }
}
