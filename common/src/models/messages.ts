export type ClientToServerMessage =
  | {
      type: 'join';
    }
  | {
      type: 'playerInput';
      pressTime: number;
      inputSequenceNumber: number;
      left: boolean;
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
      type: 'worldState';
      entities: ({entityId: string; x: number; y: number} & (
        | {
            type: 'player';
            lastProcessedInputSequenceNumber: number;
          }
        | {
            type: 'wall';
          }
      ))[];
    };
