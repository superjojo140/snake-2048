import PhaserLogo from '../objects/phaserLogo'
import FpsText from '../objects/fpsText'
import SnakeTile from '../objects/snakeTile'
import { Snake } from '../objects/snake';

export default class MainScene extends Phaser.Scene {

  constructor() {
    super({ key: 'MainScene' })
  }

  create() {
    
    const snake = new Snake(this, this.cameras.main.centerX, this.cameras.main.centerY);
    this.add.existing(snake);
    
  }

  update() {
  }
}
