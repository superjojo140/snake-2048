import Phaser from 'phaser';

export default class SnakeTile extends Phaser.GameObjects.Container {
    sizeId: number;
    width: number;
    private tileRect: Phaser.GameObjects.Rectangle;
    private valueText: Phaser.GameObjects.Text;

    /**
     * A simple colored rectangular tile for Phaser 3.
     * - container uses top-left positioning (we position the container at x,y and place children relative to 0,0)
     * - contains a Rectangle child and a centered Text child
     */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        sizeId: number,
    ) {
        super(scene, x, y);
        this.sizeId = sizeId;

        // compute size/color/value as before
        this.width = 32 + 4 * sizeId;
        const color = sizeId * 50000;
        const valueNum = 1 << sizeId; // 2^sizeId

        // create a rectangle at local coords (0,0) with top-left origin
        this.tileRect = scene.add.rectangle(0, 0, this.width, this.width, color).setOrigin(0);
        this.tileRect.setStrokeStyle(2, 0x222222);

        // compute text styling and color contrast
        const fontSize = Math.max(20, Math.floor(this.width / 3));
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const textColor = brightness > 140 ? '#000000' : '#ffffff';

        // centered text inside the container (local coords)
        this.valueText = scene.add.text(this.width / 2, this.width / 2, String(valueNum), {
            fontFamily: 'Arial',
            fontSize: `${fontSize}px`,
            color: textColor,
            align: 'center',
            fontStyle: "bold"
        }).setOrigin(0.5);

        // add children to the container and add container to scene
        this.add([this.tileRect, this.valueText]);
        this.setSize(this.width, this.width);
        scene.add.existing(this);
    }

    setTileColor(color: number, alpha?: number): this {
        this.tileRect.setFillStyle(color, alpha);
        return this;
    }

    setBorder(color: number, thickness = 2, alpha?: number): this {
        this.tileRect.setStrokeStyle(thickness, color, alpha);
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
