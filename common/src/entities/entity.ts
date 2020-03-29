export type PendingInput = {
  pressTime: number;
  inputSequenceNumber: number;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export class Entity {
  x: number = 0;
  y: number = 0;
  lastProcessedInputSequenceNumber: number = -1;

  positionBuffer: {time: number; x: number; y: number}[] = [];
  pendingInputs: PendingInput[] = [];
  inputSequenceNumber: number = 0;

  constructor(public entityId: string) {}

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
  }
}
