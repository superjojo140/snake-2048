import { FoodTile } from "./foodTile";

export class FoodTileManager {
    scene: Phaser.Scene;
    foodTiles: FoodTile[] = [];

    constructor(scene: Phaser.Scene) {
        const spawnInterval = 5000; // milliseconds
        this.scene = scene;


        // spawn one immediately, then every spawnInterval ms
        this.spawnTile();
        this.scene.time.addEvent({ delay: spawnInterval, callback: this.spawnTile, loop: true });
    }

    spawnTile = () => {
        const x = Phaser.Math.Between(0, this.scene.scale.width);
        const y = Phaser.Math.Between(0, this.scene.scale.height);
        this.foodTiles.push(new FoodTile(this.scene, x, y));
    };
}