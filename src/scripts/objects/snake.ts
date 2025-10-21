import { FoodTile } from "./foodTile.js";
import SnakeTile from "./snakeTile"

export class Snake extends Phaser.GameObjects.Container {
    snakeTiles: SnakeTile[] = []
    private moveEvent?: Phaser.Time.TimerEvent
    speed= 8;

    private mergeDelay = 800;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y) // container origin at (0,0) in world coordinates
        scene.add.existing(this)

        // create a single snake tile at the container origin, add it to the display list and track it
        const head = new SnakeTile(scene, 0, 0, 1)
        this.add(head)
        this.snakeTiles.push(head)

        let direction: 'up' | 'down' | 'left' | 'right' = 'right'

        const cursors = scene.input.keyboard.createCursorKeys()

        cursors.left.on('down', () => { if (direction !== 'right') direction = 'left' })
        cursors.right.on('down', () => { if (direction !== 'left') direction = 'right' })
        cursors.up.on('down', () => { if (direction !== 'down') direction = 'up' })
        cursors.down.on('down', () => { if (direction !== 'up') direction = 'down' })

        this.moveEvent = scene.time.addEvent({
            delay: 40,
            loop: true,
            callback: () => {
                let moveX = 0, moveY = 0, indexMod = 0;
                switch (direction) {
                    case 'left': moveX = -1 * this.speed; indexMod = 1; break
                    case 'right': moveX = 1 * this.speed; break
                    case 'up': moveY = -1 * this.speed; indexMod = 1; break
                    case 'down': moveY = 1 * this.speed; break
                }

                // record current local positions
                const prevPositions = this.snakeTiles.map(t => ({ x: t.x, y: t.y }))

                // move head
                if (this.snakeTiles.length > 0) {
                    this.snakeTiles[0].moveBy(moveX, moveY)
                }

                // move each tile to the previous position of its predecessor
                for (let i = 1; i < this.snakeTiles.length; i++) {
                    const target = prevPositions[i - 1]
                    const current = prevPositions[i]
                    const targetTile = this.snakeTiles[i - indexMod]; //indexMod has to do with direction and anchor of the rectangle...
                    const dx = (target.x - current.x) / (targetTile.width / this.speed);
                    const dy = (target.y - current.y) / (targetTile.height / this.speed);
                    this.snakeTiles[i].moveBy(dx, dy)
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
            const food: FoodTile = manager.foodTiles[i];
            if (!food || food.snakeTile.sizeId > this.getHead().sizeId) continue; //dont eat bigger

            const foodBounds = typeof food.getBounds === 'function'
                ? food.getBounds()
                : new Phaser.Geom.Rectangle(food.x, food.y, food.width ?? 16, food.height ?? 16);

            if (Phaser.Geom.Intersects.RectangleToRectangle(headBounds, foodBounds)) {
                // grow the snake: add a new tile at the current tail position
                const tail = this.snakeTiles[this.snakeTiles.length - 1];
                const newTile = new SnakeTile(this.scene, tail.x + 32, tail.y, food.snakeTile.sizeId);
                // ensure sorting happens after the new tile is pushed/added below
                setTimeout(() => {
                    // sort tiles ascending by sizeId (fallback to 0)
                    this.snakeTiles.sort((a, b) => ((b as any).sizeId ?? 0) - ((a as any).sizeId ?? 0));

                    // reorder container children to match sorted snakeTiles (remove without destroying)
                    const children = [...((this as any).list ?? [])];
                    for (const c of children) {
                        if (this.snakeTiles.indexOf(c) !== -1) this.remove(c, false);
                    }
                    for (const t of this.snakeTiles) this.add(t);

                    this.checkForTileMerge();
                }, 0);

                // remove the food from scene and manager
                if (typeof food.destroy === 'function') food.destroy();
                manager.foodTiles.splice(i, 1);


                this.add(newTile);
                this.snakeTiles.push(newTile);
            }
        }
    }
    getHead() {
       return this.snakeTiles[0];
    }

    private checkForTileMerge() {

        const scheduled = new Set<SnakeTile>();

        for (let i = 0; i < this.snakeTiles.length - 1; i++) {
            const a = this.snakeTiles[i];
            const b = this.snakeTiles[i + 1];
            const aId = (a as any).sizeId ?? 0;
            const bId = (b as any).sizeId ?? 0;

            if (aId === bId && !scheduled.has(a) && !scheduled.has(b)) {
                scheduled.add(a);
                scheduled.add(b);

                const mergedSize = aId + 1;

                // schedule replacement after 2000ms
                (this.scene as Phaser.Scene).time.addEvent({
                    delay: this.mergeDelay,
                    callback: () => {
                        // ensure both tiles still exist and still have the same sizeId
                        const idxA = this.snakeTiles.indexOf(a);
                        const idxB = this.snakeTiles.indexOf(b);
                        if (idxA === -1 || idxB === -1) return;
                        const curAId = (a as any).sizeId ?? 0;
                        const curBId = (b as any).sizeId ?? 0;
                        if (curAId !== curBId) return;

                        // remove the two tiles (remove higher index first)
                        const hi = Math.max(idxA, idxB);
                        const lo = Math.min(idxA, idxB);

                        const tileHi = this.snakeTiles[hi];
                        const tileLo = this.snakeTiles[lo];


                        // remove from array
                        this.snakeTiles.splice(hi, 1);
                        this.snakeTiles.splice(lo, 1);

                        // create merged tile and insert at lo
                        const mergedTile = new SnakeTile(this.scene, tileHi.x, tileHi.y, mergedSize);
                        this.snakeTiles.splice(lo, 0, mergedTile);
                        this.add(mergedTile);


                        // destroy old visuals
                        if (typeof tileHi.destroy === 'function') tileHi.destroy();
                        if (typeof tileLo.destroy === 'function') tileLo.destroy();

                        // reorder container children to match snakeTiles
                        const children = [...((this as any).list ?? [])];
                        for (const c of children) {
                            if (this.snakeTiles.indexOf(c) !== -1) this.remove(c, false);
                        }
                        for (const t of this.snakeTiles) this.add(t);

                        this.checkForTileMerge();
                    },
                    callbackScope: this
                });

                // skip the next one since it's paired
                i++;
            }
        }

    }
}

