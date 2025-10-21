export default class PhaserLogo extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'phaser-logo')
    scene.add.existing(this)
    
  }
}
