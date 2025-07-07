export interface DxfEntity {
  type: string;
  layer: string;
  color: number;
  coordinates: number[][];
}

export interface DxfLayer {
  name: string;
  color: number;
  entities: DxfEntity[];
}

export interface DxfData {
  layers: DxfLayer[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  entities: DxfEntity[];
}

export class DxfUtils {
  // DXF parsing is now handled by the backend server
  static async parseDxfFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('dxfFile', file);
    
    const response = await fetch('/api/dxf/parse', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to parse DXF file');
    }
    
    return response.json();
  }

  static detectZones(dxfData: DxfData): {
    walls: DxfEntity[];
    restricted: DxfEntity[];
    entrances: DxfEntity[];
  } {
    const walls: DxfEntity[] = [];
    const restricted: DxfEntity[] = [];
    const entrances: DxfEntity[] = [];

    dxfData.layers.forEach(layer => {
      layer.entities.forEach(entity => {
        switch (layer.name.toLowerCase()) {
          case 'walls':
          case 'wall':
            walls.push(entity);
            break;
          case 'restricted':
          case 'stairs':
          case 'elevator':
            restricted.push(entity);
            break;
          case 'entrances':
          case 'entrance':
          case 'door':
          case 'exit':
            entrances.push(entity);
            break;
        }
      });
    });

    return { walls, restricted, entrances };
  }

  static convertToCanvasCoordinates(
    entity: DxfEntity,
    canvasWidth: number,
    canvasHeight: number,
    dxfBounds: { minX: number; minY: number; maxX: number; maxY: number }
  ): number[][] {
    const scaleX = canvasWidth / (dxfBounds.maxX - dxfBounds.minX);
    const scaleY = canvasHeight / (dxfBounds.maxY - dxfBounds.minY);
    const scale = Math.min(scaleX, scaleY);

    return entity.coordinates.map(coord => [
      (coord[0] - dxfBounds.minX) * scale,
      (coord[1] - dxfBounds.minY) * scale
    ]);
  }

  static getEntityColor(entity: DxfEntity): string {
    // DXF color mapping
    const colorMap: { [key: number]: string } = {
      0: '#000000', // Black
      1: '#FF0000', // Red
      2: '#00FF00', // Green
      3: '#0000FF', // Blue
      4: '#00FFFF', // Cyan
      5: '#FF00FF', // Magenta
      6: '#FFFF00', // Yellow
      7: '#FFFFFF', // White
      8: '#808080', // Gray
      9: '#C0C0C0', // Light Gray
    };

    return colorMap[entity.color] || '#000000';
  }

  static calculateIlotDensity(ilots: any[], totalArea: number): number {
    const usedArea = ilots.reduce((sum, ilot) => sum + ilot.area, 0);
    return usedArea / totalArea;
  }

  static validateIlotPlacement(ilot: any, zones: any, constraints: any): boolean {
    // Check if îlot overlaps with walls or restricted areas
    const ilotBounds = {
      minX: ilot.x,
      minY: ilot.y,
      maxX: ilot.x + ilot.width,
      maxY: ilot.y + ilot.height
    };

    // Check against walls
    if (zones.walls) {
      for (const wall of zones.walls) {
        if (this.rectangleIntersectsPolyline(ilotBounds, wall.coordinates)) {
          return false;
        }
      }
    }

    // Check against restricted areas
    if (zones.restricted) {
      for (const restricted of zones.restricted) {
        if (this.rectangleIntersectsPolyline(ilotBounds, restricted.coordinates)) {
          return false;
        }
      }
    }

    return true;
  }

  private static rectangleIntersectsPolyline(rect: any, polyline: number[][]): boolean {
    if (!polyline || polyline.length < 2) return false;

    for (let i = 0; i < polyline.length - 1; i++) {
      const [x1, y1] = polyline[i];
      const [x2, y2] = polyline[i + 1];
      
      // Check if line segment intersects with rectangle
      if (this.lineIntersectsRect(x1, y1, x2, y2, rect)) {
        return true;
      }
    }
    
    return false;
  }

  private static lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, rect: any): boolean {
    const { minX, minY, maxX, maxY } = rect;
    
    // Check intersection with each edge of the rectangle
    return (
      this.lineIntersection(x1, y1, x2, y2, minX, minY, maxX, minY) || // Top edge
      this.lineIntersection(x1, y1, x2, y2, maxX, minY, maxX, maxY) || // Right edge
      this.lineIntersection(x1, y1, x2, y2, maxX, maxY, minX, maxY) || // Bottom edge
      this.lineIntersection(x1, y1, x2, y2, minX, maxY, minX, minY)    // Left edge
    );
  }

  private static lineIntersection(x1: number, y1: number, x2: number, y2: number, 
                                  x3: number, y3: number, x4: number, y4: number): boolean {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return false;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }
}
