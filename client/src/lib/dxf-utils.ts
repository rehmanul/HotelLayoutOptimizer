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
  static async parseDxfFile(file: File): Promise<DxfData> {
    // In a real implementation, this would use a proper DXF parsing library
    // For now, we'll return mock data structure
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          layers: [
            {
              name: 'WALLS',
              color: 0,
              entities: [
                {
                  type: 'LINE',
                  layer: 'WALLS',
                  color: 0,
                  coordinates: [[0, 0], [100, 0]]
                },
                {
                  type: 'LINE',
                  layer: 'WALLS',
                  color: 0,
                  coordinates: [[100, 0], [100, 100]]
                },
                {
                  type: 'LINE',
                  layer: 'WALLS',
                  color: 0,
                  coordinates: [[100, 100], [0, 100]]
                },
                {
                  type: 'LINE',
                  layer: 'WALLS',
                  color: 0,
                  coordinates: [[0, 100], [0, 0]]
                }
              ]
            },
            {
              name: 'RESTRICTED',
              color: 4,
              entities: [
                {
                  type: 'POLYLINE',
                  layer: 'RESTRICTED',
                  color: 4,
                  coordinates: [[10, 10], [20, 10], [20, 20], [10, 20], [10, 10]]
                }
              ]
            },
            {
              name: 'ENTRANCES',
              color: 1,
              entities: [
                {
                  type: 'LINE',
                  layer: 'ENTRANCES',
                  color: 1,
                  coordinates: [[45, 0], [55, 0]]
                }
              ]
            }
          ],
          bounds: {
            minX: 0,
            minY: 0,
            maxX: 100,
            maxY: 100
          },
          entities: []
        });
      }, 1000);
    });
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
}
