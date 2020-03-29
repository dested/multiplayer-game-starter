export type ClientToServerMessage =
  | {
      type: 'join';
    }
  | {
      type: 'playerInput';
      pressTime: number;
      inputSequenceNumber: number;
      left: boolean;
      shoot: boolean;
      right: boolean;
      up: boolean;
      down: boolean;
    };

export type ServerToClientMessage =
  | {
      type: 'joined';
      clientId: string;
      entityId: string;
      x: number;
      y: number;
    }
  | {
      type: 'createEntity';
      entityType: 'shot';
      entityId: string;
      x: number;
      y: number;
    }
  | {
      type: 'worldState';
      entities: ({entityId: string; x: number; y: number} & (
        | {
            type: 'player';
            lastProcessedInputSequenceNumber: number;
          }
        | {
            type: 'wall';
            width: number;
            height: number;
          }
        | {
            type: 'shot';
            markToDestroy: boolean;
          }
      ))[];
    };
