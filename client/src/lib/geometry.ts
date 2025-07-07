export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ilot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  type: string;
}

export interface Corridor {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'corridor';
}

export interface Zone {
  id: number;
  type: 'wall' | 'restricted' | 'entrance';
  coordinates: Point[];
  color: string;
}

export class GeometryEngine {
  static calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  static calculateArea(rect: Rectangle): number {
    return rect.width * rect.height;
  }

  static rectanglesOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  }

  static pointInRectangle(point: Point, rect: Rectangle): boolean {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }

  static findAvailableSpace(
    bounds: Rectangle,
    obstacles: Rectangle[],
    targetSize: Rectangle
  ): Point | null {
    const step = 5; // Grid step for placement testing
    
    for (let y = bounds.y; y <= bounds.y + bounds.height - targetSize.height; y += step) {
      for (let x = bounds.x; x <= bounds.x + bounds.width - targetSize.width; x += step) {
        const testRect = { x, y, width: targetSize.width, height: targetSize.height };
        
        // Check if this position conflicts with any obstacles
        const hasConflict = obstacles.some(obstacle => 
          this.rectanglesOverlap(testRect, obstacle)
        );
        
        if (!hasConflict) {
          return { x, y };
        }
      }
    }
    
    return null;
  }

  static generateIlotLayout(
    availableArea: Rectangle,
    distribution: { [key: string]: number },
    constraints: Zone[]
  ): Ilot[] {
    const ilots: Ilot[] = [];
    const obstacles: Rectangle[] = [];
    
    // Convert constraints to obstacles
    constraints.forEach(constraint => {
      if (constraint.type === 'restricted' || constraint.type === 'wall') {
        // Simplified conversion - in real implementation, would handle complex polygons
        const minX = Math.min(...constraint.coordinates.map(p => p.x));
        const maxX = Math.max(...constraint.coordinates.map(p => p.x));
        const minY = Math.min(...constraint.coordinates.map(p => p.y));
        const maxY = Math.max(...constraint.coordinates.map(p => p.y));
        
        obstacles.push({
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        });
      }
    });

    // Calculate total area for distribution
    const totalArea = this.calculateArea(availableArea);
    let currentId = 1;

    // Define size ranges
    const sizeRanges = [
      { key: 'size0to1', min: 0.5, max: 1.0, percentage: distribution.size0to1 || 0 },
      { key: 'size1to3', min: 1.0, max: 3.0, percentage: distribution.size1to3 || 0 },
      { key: 'size3to5', min: 3.0, max: 5.0, percentage: distribution.size3to5 || 0 },
      { key: 'size5to10', min: 5.0, max: 10.0, percentage: distribution.size5to10 || 0 }
    ];

    // Generate îlots for each size range
    sizeRanges.forEach(range => {
      const targetArea = totalArea * (range.percentage / 100);
      let placedArea = 0;
      
      while (placedArea < targetArea) {
        // Generate random size within range
        const area = Math.random() * (range.max - range.min) + range.min;
        const aspectRatio = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        
        const width = Math.sqrt(area / aspectRatio);
        const height = area / width;
        
        // Try to place the îlot
        const position = this.findAvailableSpace(
          availableArea,
          [...obstacles, ...ilots],
          { x: 0, y: 0, width, height }
        );
        
        if (position) {
          const ilot: Ilot = {
            id: currentId++,
            x: position.x,
            y: position.y,
            width,
            height,
            area,
            type: range.key
          };
          
          ilots.push(ilot);
          placedArea += area;
        } else {
          // Can't place more îlots of this size
          break;
        }
      }
    });

    return ilots;
  }

  static generateCorridors(
    ilots: Ilot[],
    availableArea: Rectangle,
    corridorWidth: number = 1.5
  ): Corridor[] {
    const corridors: Corridor[] = [];
    let currentId = 1;

    // Simple corridor generation - connect facing îlots
    for (let i = 0; i < ilots.length; i++) {
      for (let j = i + 1; j < ilots.length; j++) {
        const ilot1 = ilots[i];
        const ilot2 = ilots[j];
        
        // Check if îlots are facing each other horizontally
        if (Math.abs(ilot1.y - ilot2.y) < Math.max(ilot1.height, ilot2.height) &&
            Math.abs(ilot1.x - ilot2.x) > Math.max(ilot1.width, ilot2.width)) {
          
          const corridor: Corridor = {
            id: currentId++,
            x: Math.min(ilot1.x + ilot1.width, ilot2.x + ilot2.width),
            y: Math.min(ilot1.y, ilot2.y),
            width: Math.abs(ilot1.x - ilot2.x) - Math.max(ilot1.width, ilot2.width),
            height: corridorWidth,
            type: 'corridor'
          };
          
          corridors.push(corridor);
        }
      }
    }

    return corridors;
  }

  static calculateCoverage(ilots: Ilot[], totalArea: number): number {
    const usedArea = ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    return Math.min(usedArea / totalArea, 1.0);
  }
}
