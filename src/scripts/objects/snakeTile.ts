import Phaser from 'phaser';

export default class SnakeTile extends Phaser.GameObjects.Rectangle {

    /**
     * A simple colored rectangular tile for Phaser 3.
     * - default origin is (0,0) for grid-friendly positioning
     * - includes helpers to change color and animate moves
     */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width = 32,
        height = 32,
        color = 0x66cc66
    ) {
        super(scene, x, y, width, height, color);
        this.setOrigin(0); // use top-left origin for tile grids
        scene.add.existing(this);
        // optional border to make tiles readable on any background
        this.setStrokeStyle(2, 0x222222);
    }

    setTileColor(color: number, alpha?: number): this {
        this.setFillStyle(color, alpha);
        return this;
    }

    setBorder(color: number, thickness = 2, alpha?: number): this {
        this.setStrokeStyle(thickness, color, alpha);
        return this;
    }



    moveBy(moveX: number, moveY: number) {
        this.x = this.x + moveX;
        this.y = this.y + moveY;

    }

    /**
     * Briefly pulse the tile to indicate a merge/score.
     */
    pulse(scale = 1.15, duration = 120): Promise<void> {
        return new Promise((resolve) => {
            const originalScaleX = this.scaleX;
            const originalScaleY = this.scaleY;
            this.scene.tweens.timeline({
                targets: this,
                tweens: [
                    { scaleX: originalScaleX * scale, scaleY: originalScaleY * scale, duration: duration / 2, ease: 'Quad.Out' },
                    { scaleX: originalScaleX, scaleY: originalScaleY, duration: duration / 2, ease: 'Quad.In' },
                ],
                onComplete: () => resolve(),
            });
        });
    }
}