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
        const valueNum = 1 << sizeId; // 2^sizeId
        const prettyPrint = (n: number): string => {
            const units = ['', 'k', 'M', 'G', 'T', 'P'];
            let value = n;
            let unit = 0;
            while (value >= 1024 && unit < units.length - 1) {
                value /= 1024;
                unit++;
            }
            if (unit === 0) return String(n);
            let s: string;
            if (Number.isInteger(value)) s = String(value);
            else s = value >= 10 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, '');
            return s + units[unit];
        };

        const displayValue = prettyPrint(valueNum);

        // produce a color that moves through the hue wheel as sizeId increases,
        // and slightly darkens for larger tiles for better contrast
        const hue = (sizeId * 37) % 360;
        const saturation = 80;
        const lightness = Math.max(32, 68 - sizeId * 3);

        const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
            s /= 100;
            l /= 100;
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const hh = h / 60;
            const x = c * (1 - Math.abs((hh % 2) - 1));
            let r1 = 0, g1 = 0, b1 = 0;
            if (0 <= hh && hh < 1) { r1 = c; g1 = x; b1 = 0; }
            else if (1 <= hh && hh < 2) { r1 = x; g1 = c; b1 = 0; }
            else if (2 <= hh && hh < 3) { r1 = 0; g1 = c; b1 = x; }
            else if (3 <= hh && hh < 4) { r1 = 0; g1 = x; b1 = c; }
            else if (4 <= hh && hh < 5) { r1 = x; g1 = 0; b1 = c; }
            else { r1 = c; g1 = 0; b1 = x; }
            const m = l - c / 2;
            const r = Math.round((r1 + m) * 255);
            const g = Math.round((g1 + m) * 255);
            const b = Math.round((b1 + m) * 255);
            return [r, g, b];
        };

        const [R, G, B] = hslToRgb(hue, saturation, lightness);
        const color = (R << 16) | (G << 8) | B;

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
        this.valueText = scene.add.text(this.width / 2, this.width / 2, String(displayValue), {
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
