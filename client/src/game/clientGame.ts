import {ClientToServerMessage, ServerToClientMessage} from '../../../common/src/models/messages';
import {unreachable} from '../../../common/src/utils/unreachable';
import {uuid} from '../../../common/src/utils/uuid';
import {ClientSocket, IClientSocket} from '../clientSocket';
import {GameConstants} from '../../../common/src/game/gameConstants';
import {Entity} from '../../../common/src/entities/entity';

export class ClientGame {
  connectionId: string;
  protected isDead: boolean = false;

  entities: ClientEntity[] = [];
  protected liveEntity?: ClientEntity;

  constructor(
    private options: {onDied: (me: ClientGame) => void; onDisconnect: (me: ClientGame) => void},
    private socket: IClientSocket
  ) {
    this.connectionId = uuid();
    this.socket.connect({
      onOpen: () => {
        this.sendMessageToServer({type: 'join'});
      },
      onDisconnect: () => {
        options.onDisconnect(this);
      },

      onMessage: messages => {
        this.processMessages(messages);
      },
    });

    this.startTick();
  }

  private startTick() {
    let time = +new Date();
    let paused = 0;
    const int = setInterval(() => {
      if (this.isDead) {
        clearInterval(int);
        return;
      }
      const now = +new Date();
      const duration = now - time;
      if (duration > 900 || duration < 4) {
        paused++;
      } else {
        if (paused > 3) {
          paused = 0;
          /*
           console.log('resync');
          this.sendMessageToServer({
            type: 'resync',
          });
*/
        }
      }
      this.tick(duration);
      time = +new Date();
    }, 1000 / 60);
  }

  sendMessageToServer(message: ClientToServerMessage) {
    this.socket.sendMessage(message);
  }

  processMessages(messages: ServerToClientMessage[]) {
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          {
            const clientEntity = new ClientEntity(message.entityId);
            clientEntity.x = message.x;
            clientEntity.y = message.y;
            this.liveEntity = clientEntity;
            this.entities.push(clientEntity);
          }
          break;
        case 'worldState':
          {
            for (const entity of message.entities) {
              let foundEntity = this.entities.find(a => a.entityId === entity.entityId);
              if (!foundEntity) {
                foundEntity = new ClientEntity(entity.entityId);
                foundEntity.x = entity.x;
                foundEntity.y = entity.y;
                foundEntity.lastProcessedInputSequenceNumber = entity.lastProcessedInputSequenceNumber;
                this.entities.push(foundEntity);
              }

              if (foundEntity.entityId === this.liveEntity?.entityId) {
                foundEntity.x = entity.x;
                foundEntity.y = entity.y;

                let j = 0;
                while (j < foundEntity.pendingInputs.length) {
                  const input = foundEntity.pendingInputs[j];
                  if (input.inputSequenceNumber <= entity.lastProcessedInputSequenceNumber) {
                    // Already processed. Its effect is already taken into account into the world update
                    // we just got, so we can drop it.
                    foundEntity.pendingInputs.splice(j, 1);
                  } else {
                    // Not processed by the server yet. Re-apply it.
                    foundEntity.applyInput(input);
                    j++;
                  }
                }
              } else {
                foundEntity.positionBuffer.push({time: +new Date(), x: entity.x, y: entity.y});
              }
            }
          }
          break;
        default:
          unreachable(message);
          break;
      }
    }
  }

  tick(duration: number) {
    if (!this.connectionId) {
      return;
    }

    this.processInputs(duration);
    this.interpolateEntities();
  }

  private interpolateEntities() {
    const now = +new Date();
    const renderTimestamp = now - GameConstants.serverTickRate;

    for (const i in this.entities) {
      const entity = this.entities[i];

      // No point in interpolating this client's entity.
      if (entity === this.liveEntity) {
        continue;
      }

      // Find the two authoritative positions surrounding the rendering timestamp.
      const buffer = entity.positionBuffer;

      // Drop older positions.
      while (buffer.length >= 2 && buffer[1].time <= renderTimestamp) {
        buffer.shift();
      }

      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0].time <= renderTimestamp && renderTimestamp <= buffer[1].time) {
        const x0 = buffer[0].x;
        const x1 = buffer[1].x;
        const y0 = buffer[0].y;
        const y1 = buffer[1].y;
        const t0 = buffer[0].time;
        const t1 = buffer[1].time;

        entity.x = x0 + ((x1 - x0) * (renderTimestamp - t0)) / (t1 - t0);
        entity.y = y0 + ((y1 - y0) * (renderTimestamp - t0)) / (t1 - t0);
      }
    }
  }

  disconnect() {
    this.socket.disconnect();
  }

  private processInputs(duration: number) {
    if (!this.liveEntity) return;

    if (
      !this.liveEntity.keys.left &&
      !this.liveEntity.keys.right &&
      !this.liveEntity.keys.up &&
      !this.liveEntity.keys.down
    ) {
      return;
    }

    // Compute delta time since last update.
    const durationSeconds = duration / 1000.0;

    // Package player's input.
    const input = {
      pressTime: durationSeconds,
      ...this.liveEntity.keys,
      inputSequenceNumber: this.liveEntity.inputSequenceNumber++,
    };

    this.sendMessageToServer({type: 'playerInput', ...input});

    this.liveEntity.applyInput(input);

    this.liveEntity.pendingInputs.push(input);
  }
}

export class ClientEntity extends Entity {
  constructor(public entityId: string) {
    super(entityId);
  }

  keys = {up: false, down: false, left: false, right: false};

  pressUp() {
    this.keys.up = true;
  }
  pressDown() {
    this.keys.down = true;
  }
  pressLeft() {
    this.keys.left = true;
  }
  pressRight() {
    this.keys.right = true;
  }
  releaseUp() {
    this.keys.up = false;
  }
  releaseDown() {
    this.keys.down = false;
  }
  releaseLeft() {
    this.keys.left = false;
  }
  releaseRight() {
    this.keys.right = false;
  }
}
