import Phaser from 'phaser';
import SnakeTile from './snakeTile';


/**
 * FoodTile: a Phaser GameObject (Container) that owns a SnakeTile.
 * - The container is added to the scene.
 * - The SnakeTile is kept as a child of this container.
 */
export class FoodTile extends Phaser.GameObjects.Container {
    public snakeTile: SnakeTile;

    constructor(scene: Phaser.Scene, x: number, y: number, sizeId = 1) {
        super(scene, x, y);

        scene.add.existing(this);

        // Use provided SnakeTile or create a simple default one
        this.snakeTile = new SnakeTile(scene, 0, 0, sizeId);
        this.add(this.snakeTile);
    }



    destroy(fromScene?: boolean) {
        // Ensure child is destroyed before container
        if (this.snakeTile) {
            this.snakeTile.destroy();
        }
        super.destroy(fromScene);
    }
}