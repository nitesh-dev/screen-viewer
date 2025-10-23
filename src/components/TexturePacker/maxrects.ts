// maxRects.ts
import type { Rectangle, PlacedRect, FreeRect, PackResult } from './types';

export class MaxRectsPacker {
  private autoExpand: boolean;
  private initialWidth: number;
  private initialHeight: number;
  private gap: number;

  constructor(autoExpand = true, initialWidth = 400, initialHeight = 400, gap = 0) {
    this.autoExpand = autoExpand;
    this.initialWidth = initialWidth;
    this.initialHeight = initialHeight;
    this.gap = gap;
  }

  private intersects(r1: FreeRect, r2: FreeRect): boolean {
    return !(
      r1.x >= r2.x + r2.width ||
      r1.x + r1.width <= r2.x ||
      r1.y >= r2.y + r2.height ||
      r1.y + r1.height <= r2.y
    );
  }

  private isContainedIn(smaller: FreeRect, larger: FreeRect): boolean {
    return (
      smaller.x >= larger.x &&
      smaller.y >= larger.y &&
      smaller.x + smaller.width <= larger.x + larger.width &&
      smaller.y + smaller.height <= larger.y + larger.height
    );
  }

  private pruneFreeRects(freeRects: FreeRect[]): FreeRect[] {
    const pruned: FreeRect[] = [];
    for (let i = 0; i < freeRects.length; i++) {
      let contained = false;
      for (let j = 0; j < freeRects.length; j++) {
        if (i !== j && this.isContainedIn(freeRects[i], freeRects[j])) {
          contained = true;
          break;
        }
      }
      if (!contained) {
        pruned.push(freeRects[i]);
      }
    }
    return pruned;
  }

  private splitFreeRect(freeRect: FreeRect, usedRect: FreeRect): FreeRect[] {
    const result: FreeRect[] = [];

    if (!this.intersects(freeRect, usedRect)) {
      return [freeRect];
    }

    if (usedRect.x > freeRect.x) {
      result.push({
        x: freeRect.x,
        y: freeRect.y,
        width: usedRect.x - freeRect.x,
        height: freeRect.height,
      });
    }

    if (usedRect.x + usedRect.width < freeRect.x + freeRect.width) {
      result.push({
        x: usedRect.x + usedRect.width,
        y: freeRect.y,
        width: freeRect.x + freeRect.width - (usedRect.x + usedRect.width),
        height: freeRect.height,
      });
    }

    if (usedRect.y > freeRect.y) {
      result.push({
        x: freeRect.x,
        y: freeRect.y,
        width: freeRect.width,
        height: usedRect.y - freeRect.y,
      });
    }

    if (usedRect.y + usedRect.height < freeRect.y + freeRect.height) {
      result.push({
        x: freeRect.x,
        y: usedRect.y + usedRect.height,
        width: freeRect.width,
        height: freeRect.y + freeRect.height - (usedRect.y + usedRect.height),
      });
    }

    return result;
  }

  private findBestPosition(
    rectWidth: number,
    rectHeight: number,
    freeRects: FreeRect[],
    currentMaxX: number,
    currentMaxY: number
  ): { rect: FreeRect | null; rotation: boolean } {
    let bestRect: FreeRect | null = null;
    let bestRotation = false;
    let bestScore = Infinity;

    const orientations = [
      { w: rectWidth, h: rectHeight, rot: false },
      { w: rectHeight, h: rectWidth, rot: true },
    ];

    for (const orient of orientations) {
      for (const freeRect of freeRects) {
        if (orient.w <= freeRect.width && orient.h <= freeRect.height) {
          const newMaxX = Math.max(currentMaxX, freeRect.x + orient.w);
          const newMaxY = Math.max(currentMaxY, freeRect.y + orient.h);

          const areaExpansion = newMaxX * newMaxY - currentMaxX * currentMaxY;
          const leftoverX = freeRect.width - orient.w;
          const leftoverY = freeRect.height - orient.h;
          const shortSideFit = Math.min(leftoverX, leftoverY);

          const score =
            areaExpansion * 1000000 +
            shortSideFit * 10000 +
            (newMaxX + newMaxY) * 100 +
            freeRect.y * 10 +
            freeRect.x;

          if (score < bestScore) {
            bestRect = freeRect;
            bestRotation = orient.rot;
            bestScore = score;
          }
        }
      }
    }

    return { rect: bestRect, rotation: bestRotation };
  }

  pack(rects: Rectangle[]): PackResult {
    const sortedRects = [...rects].sort((a, b) => {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      return areaB - areaA;
    });

    const packed: PlacedRect[] = [];
    let freeRects: FreeRect[] = [];
    let maxX = 0;
    let maxY = 0;

    const totalArea = sortedRects.reduce(
      (sum, r) => sum + (r.width + this.gap) * (r.height + this.gap),
      0
    );
    const estimatedSize = Math.ceil(Math.sqrt(totalArea * 1.3));

    if (this.autoExpand) {
      freeRects = [{ x: 0, y: 0, width: estimatedSize, height: estimatedSize }];
    } else {
      freeRects = [
        { x: 0, y: 0, width: this.initialWidth, height: this.initialHeight },
      ];
    }

    for (let i = 0; i < sortedRects.length; i++) {
      const rect = sortedRects[i];
      let rectWidth = rect.width + this.gap;
      let rectHeight = rect.height + this.gap;

      const { rect: bestRect, rotation } = this.findBestPosition(
        rectWidth,
        rectHeight,
        freeRects,
        maxX,
        maxY
      );

      if (rotation) {
        [rectWidth, rectHeight] = [rectHeight, rectWidth];
      }

      if (bestRect) {
        const placedRect: PlacedRect = {
          ...rect,
          x: bestRect.x,
          y: bestRect.y,
          width: rotation ? rect.height : rect.width,
          height: rotation ? rect.width : rect.height,
        };

        packed.push(placedRect);

        maxX = Math.max(maxX, bestRect.x + rectWidth);
        maxY = Math.max(maxY, bestRect.y + rectHeight);

        const usedRect: FreeRect = {
          x: bestRect.x,
          y: bestRect.y,
          width: rectWidth,
          height: rectHeight,
        };

        const newFreeRects: FreeRect[] = [];
        for (const freeRect of freeRects) {
          const splits = this.splitFreeRect(freeRect, usedRect);
          newFreeRects.push(...splits);
        }

        freeRects = this.pruneFreeRects(newFreeRects);
      } else if (this.autoExpand) {
        const expandRight = maxX + rectWidth;
        const expandDown = maxY + rectHeight;

        const areaRight = expandRight * maxY;
        const areaDown = maxX * expandDown;

        let newX = 0,
          newY = 0;

        if (areaRight < areaDown) {
          newX = maxX;
          newY = 0;
          maxX = expandRight;
        } else {
          newX = 0;
          newY = maxY;
          maxY = expandDown;
        }

        const placedRect: PlacedRect = {
          ...rect,
          x: newX,
          y: newY,
          width: rotation ? rect.height : rect.width,
          height: rotation ? rect.width : rect.height,
        };

        packed.push(placedRect);

        const usedRect: FreeRect = {
          x: newX,
          y: newY,
          width: rectWidth,
          height: rectHeight,
        };

        const newFreeRects: FreeRect[] = [];
        for (const freeRect of freeRects) {
          const splits = this.splitFreeRect(freeRect, usedRect);
          newFreeRects.push(...splits);
        }

        if (newX === maxX - rectWidth) {
          newFreeRects.push({
            x: newX,
            y: rectHeight,
            width: rectWidth,
            height: Math.max(estimatedSize, maxY) - rectHeight,
          });
          newFreeRects.push({
            x: maxX,
            y: 0,
            width: estimatedSize,
            height: Math.max(estimatedSize, maxY),
          });
        } else {
          newFreeRects.push({
            x: rectWidth,
            y: newY,
            width: Math.max(estimatedSize, maxX) - rectWidth,
            height: rectHeight,
          });
          newFreeRects.push({
            x: 0,
            y: maxY,
            width: Math.max(estimatedSize, maxX),
            height: estimatedSize,
          });
        }

        freeRects = this.pruneFreeRects(newFreeRects);
      }
    }

    return {
      packed,
      width: this.autoExpand ? maxX : Math.max(this.initialWidth, maxX),
      height: this.autoExpand ? maxY : Math.max(this.initialHeight, maxY),
    };
  }
}