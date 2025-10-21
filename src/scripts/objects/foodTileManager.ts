import { FoodTile } from "./foodTile";
import { Snake } from "./snake.js";

export class FoodTileManager {
    scene: Phaser.Scene;
    foodTiles: FoodTile[] = [];
    snake: Snake;

    constructor(scene: Phaser.Scene, snake: Snake) {
        const spawnInterval = 1000; // milliseconds
        this.scene = scene;
        this.snake = snake;


        // spawn one immediately, then every spawnInterval ms
        this.spawnTile();
        this.scene.time.addEvent({ delay: spawnInterval, callback: this.spawnTile, loop: true });
    }

    spawnTile = () => {
        const x = Phaser.Math.Between(0, this.scene.scale.width);
        const y = Phaser.Math.Between(0, this.scene.scale.height);
        const sizeId = Phaser.Math.Between(1, 3);
        this.foodTiles.push(new FoodTile(this.scene, x, y, sizeId));
    };
}