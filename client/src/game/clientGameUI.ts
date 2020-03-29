import {Manager, Pan, Pinch, Press, Swipe, Tap} from 'hammerjs';
import {ClientSocket, IClientSocket} from '../clientSocket';
import {ClientGame} from './clientGame';
import {GameView} from './gameView';

export class ClientGameUI extends ClientGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  view: GameView;

  constructor(options: {onDied: () => void; onDisconnect: () => void}, socket: IClientSocket) {
    super(options, socket);
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;
    this.view = new GameView(this.canvas);

    const manager = new Manager(this.canvas);
    manager.add(new Press({time: 0}));
    manager.add(new Tap({event: 'doubletap', taps: 2, interval: 500})).recognizeWith(manager.get('press'));
    manager
      .add(new Tap({taps: 1}))
      .requireFailure('doubletap')
      .recognizeWith(manager.get('press'));

    window.addEventListener(
      'resize',
      () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.view.setBounds(window.innerWidth, window.innerHeight);
        this.draw();
      },
      true
    );

    /*
    let lastPress: Date = new Date();
    let doubleTap = false;
      manager.on('press', e => {
      doubleTap = +new Date() - +lastPress < 200;
      lastPress = new Date();
    });
    manager.on('pressup', e => {
      doubleTap = false;
    });

    manager.on('tap', e => {});

    manager.on('doubletap', e => {});
*/
    document.onkeydown = e => {
      if (e.keyCode === 38) {
        this.liveEntity?.pressUp();
      } else if (e.keyCode === 40) {
        this.liveEntity?.pressDown();
      } else if (e.keyCode === 37) {
        this.liveEntity?.pressLeft();
      } else if (e.keyCode === 39) {
        this.liveEntity?.pressRight();
      }
      // e.preventDefault();
    };
    document.onkeyup = e => {
      if (e.keyCode === 38) {
        this.liveEntity?.releaseUp();
      } else if (e.keyCode === 40) {
        this.liveEntity?.releaseDown();
      } else if (e.keyCode === 37) {
        this.liveEntity?.releaseLeft();
      } else if (e.keyCode === 39) {
        this.liveEntity?.releaseRight();
      }
    };

    const requestNextFrame = () => {
      requestAnimationFrame(() => {
        this.draw();
        requestNextFrame();
      });
    };
    requestNextFrame();
  }

  draw() {
    const context = this.context;

    context.fillStyle = 'rgba(0,0,0,1)';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.connectionId) {
      context.fillStyle = 'white';
      context.fillText('Connecting...', 100, 100);
      return;
    }
    context.save();

    context.font = '25px bold';
    for (const entity of this.entities) {
      switch (entity.type) {
        case 'player':
          context.fillStyle = 'red';
          context.fillText(`${entity.x.toFixed(1)},${entity.y.toFixed(1)}`, entity.x, entity.y - 25);
          context.fillRect(entity.x - 15, entity.y - 15, 30, 30);
          break;
        case 'wall':
          context.fillStyle = 'white';
          context.fillText(`${entity.x.toFixed(1)},${entity.y.toFixed(1)}`, entity.x, entity.y - 25);
          context.fillRect(entity.x - 15, entity.y - 15, 30, 30);
          break;
      }
    }

    context.restore();
  }
}
