import SnakeTile from "./snakeTile"

export class Snake extends Phaser.GameObjects.Container {
    private snakeTiles: SnakeTile[] = []
    private moveEvent?: Phaser.Time.TimerEvent
    speed: number = 4;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y) // container origin at (0,0) in world coordinates
        scene.add.existing(this)

        // create a single snake tile at the container origin, add it to the display list and track it
        const head = new SnakeTile(scene, 0, 0)
        this.add(head)
        this.snakeTiles.push(head)

        let direction: 'up' | 'down' | 'left' | 'right' = 'right'

        const cursors = scene.input.keyboard.createCursorKeys()

        cursors.left.on('down', () => { if (direction !== 'right') direction = 'left' })
        cursors.right.on('down', () => { if (direction !== 'left') direction = 'right' })
        cursors.up.on('down', () => { if (direction !== 'down') direction = 'up' })
        cursors.down.on('down', () => { if (direction !== 'up') direction = 'down' })

        this.moveEvent = scene.time.addEvent({
            delay: 20,
            loop: true,
            callback: () => {
                let moveX = 0, moveY = 0;
                switch (direction) {
                    case 'left': moveX = -1 * this.speed; break
                    case 'right': moveX = 1 * this.speed; break
                    case 'up': moveY = -1 * this.speed; break
                    case 'down': moveY = 1 * this.speed; break
                }

                for (const snakeTile of this.snakeTiles) {
                    snakeTile.moveBy(moveX, moveY);
                }

                this.checkFoodCollision();

            }
        })
    }

    // clean up timer and tiles when container is destroyed
    destroy(fromScene?: boolean) {
        if (this.moveEvent) {
            this.moveEvent.remove(false)
            this.moveEvent = undefined
        }
        // ensure all tiles are destroyed
        for (const t of this.snakeTiles) {
            if (t && (t as any).destroy) (t as any).destroy()
        }
        this.snakeTiles = []
        super.destroy(fromScene)
    }

    checkFoodCollision() {
        const head = this.snakeTiles[0];
        if (!head) return;

        const manager = (this.scene as any).foodTileManager;
        if (!manager || !Array.isArray(manager.foodTiles)) return;

        const headBounds = typeof head.getBounds === 'function'
            ? head.getBounds()
            : new Phaser.Geom.Rectangle(head.x, head.y, head.width ?? 16, head.height ?? 16);

        for (let i = manager.foodTiles.length - 1; i >= 0; i--) {
            const food = manager.foodTiles[i];
            if (!food) continue;

            const foodBounds = typeof food.getBounds === 'function'
                ? food.getBounds()
                : new Phaser.Geom.Rectangle(food.x, food.y, food.width ?? 16, food.height ?? 16);

            if (Phaser.Geom.Intersects.RectangleToRectangle(headBounds, foodBounds)) {
                // remove the food from scene and manager
                if (typeof food.destroy === 'function') food.destroy();
                manager.foodTiles.splice(i, 1);

                // grow the snake: add a new tile at the current tail position
                const tail = this.snakeTiles[this.snakeTiles.length - 1];
                const newTile = new SnakeTile(this.scene, tail.x+64, tail.y);
                this.add(newTile);
                this.snakeTiles.push(newTile);
            }
        }
    }
}

