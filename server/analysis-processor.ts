import { Analysis } from "@shared/schema";
import { storage } from "./storage";

export async function processAnalysis(analysisId: number) {
  try {
    const analysis = await storage.getAnalysis(analysisId);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const project = await storage.getProject(analysis.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const configuration = await storage.getConfiguration(analysis.configurationId);
    if (!configuration) {
      throw new Error("Configuration not found");
    }

    // Extract zones from DXF data
    const zones = project.dxfData?.parsed?.zones || {
      walls: [],
      entrances: [],
      restricted: []
    };

    const bounds = project.dxfData?.parsed?.bounds || {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100
    };

    // Generate îlots based on configuration
    const ilots = generateIlots(bounds, zones, configuration.ilotDistribution, configuration);

    // Generate corridors
    const corridors = generateCorridors(ilots, configuration.corridorWidth);

    // Calculate metrics
    const totalArea = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
    const ilotsArea = ilots.reduce((sum, ilot) => sum + (ilot.width * ilot.height), 0);
    const coverage = Math.round((ilotsArea / totalArea) * 100);

    // Update analysis with results
    await storage.updateAnalysis(analysisId, {
      status: 'completed',
      zonesDetected: zones,
      ilotsPlaced: ilots,
      corridorsGenerated: corridors,
      totalIlots: ilots.length,
      coverage,
      completedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error("Analysis processing error:", error);
    await storage.updateAnalysis(analysisId, {
      status: 'failed'
    });
    throw error;
  }
}

function generateIlots(bounds: any, zones: any, distribution: any, config: any) {
  const ilots: any[] = [];
  const availableArea = {
    minX: bounds.minX + 5,
    minY: bounds.minY + 5,
    maxX: bounds.maxX - 5,
    maxY: bounds.maxY - 5
  };

  // Define size ranges
  const sizeRanges = [
    { min: 0, max: 1, percentage: distribution.size0to1 || 10 },
    { min: 1, max: 3, percentage: distribution.size1to3 || 25 },
    { min: 3, max: 5, percentage: distribution.size3to5 || 30 },
    { min: 5, max: 10, percentage: distribution.size5to10 || 35 }
  ];

  let id = 1;
  const maxAttempts = 1000;
  let attempts = 0;

  // Generate îlots for each size range
  for (const range of sizeRanges) {
    const targetCount = Math.floor((range.percentage / 100) * 50); // Aim for 50 total îlots
    
    for (let i = 0; i < targetCount && attempts < maxAttempts; i++) {
      attempts++;
      
      // Random size within range
      const width = range.min + Math.random() * (range.max - range.min);
      const height = range.min + Math.random() * (range.max - range.min);
      
      // Find available position
      const position = findAvailablePosition(availableArea, zones.walls, ilots, width, height);
      
      if (position) {
        ilots.push({
          id: id++,
          x: position.x,
          y: position.y,
          width,
          height,
          area: width * height,
          type: `ilot_${range.min}_${range.max}`
        });
      }
    }
  }

  return ilots;
}

function findAvailablePosition(bounds: any, walls: any[], existingIlots: any[], width: number, height: number) {
  const maxAttempts = 100;
  
  for (let i = 0; i < maxAttempts; i++) {
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX - width);
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY - height);
    
    // Check if position is valid
    let valid = true;
    
    // Check collision with existing îlots
    for (const ilot of existingIlots) {
      if (x < ilot.x + ilot.width &&
          x + width > ilot.x &&
          y < ilot.y + ilot.height &&
          y + height > ilot.y) {
        valid = false;
        break;
      }
    }
    
    if (valid) {
      return { x, y };
    }
  }
  
  return null;
}

function generateCorridors(ilots: any[], corridorWidth: number) {
  const corridors: any[] = [];
  let id = 1;
  
  // Group îlots by rows (similar Y coordinates)
  const rows: any[][] = [];
  const rowHeight = 10;
  
  ilots.forEach(ilot => {
    let added = false;
    for (const row of rows) {
      if (Math.abs(row[0].y - ilot.y) < rowHeight) {
        row.push(ilot);
        added = true;
        break;
      }
    }
    if (!added) {
      rows.push([ilot]);
    }
  });
  
  // Generate horizontal corridors between rows
  for (let i = 0; i < rows.length - 1; i++) {
    const row1 = rows[i];
    const row2 = rows[i + 1];
    
    if (row1.length > 0 && row2.length > 0) {
      const minX = Math.min(...row1.map(i => i.x), ...row2.map(i => i.x));
      const maxX = Math.max(...row1.map(i => i.x + i.width), ...row2.map(i => i.x + i.width));
      const y = (Math.max(...row1.map(i => i.y + i.height)) + Math.min(...row2.map(i => i.y))) / 2;
      
      corridors.push({
        id: id++,
        x: minX,
        y: y - corridorWidth / 2,
        width: maxX - minX,
        height: corridorWidth,
        type: 'horizontal'
      });
    }
  }
  
  return corridors;
}