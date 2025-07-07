import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertProjectSchema, insertConfigurationSchema, insertAnalysisSchema } from "@shared/schema";
import { z } from "zod";
import DxfParser from "dxf-parser";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { Jimp } from "jimp";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.dxf')) {
      cb(null, true);
    } else {
      cb(new Error('Only DXF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      // For now, use a default user ID - in production, this would come from authentication
      const userId = 1;
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", upload.single('dxfFile'), async (req: MulterRequest, res) => {
    try {
      const { name, description } = req.body;
      let dxfData = null;
      let parsedData = null;

      if (req.file) {
        // Parse DXF file
        const dxfContent = fs.readFileSync(req.file.path, 'utf8');
        const parser = new DxfParser();
        const parsed = parser.parseSync(dxfContent);
        
        parsedData = await processDxfData(parsed);
        
        dxfData = {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          parsed: parsedData
        };

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
      }

      const projectData = insertProjectSchema.parse({
        name,
        description,
        dxfData,
        floorPlanImage: null,
        userId: 1
      });

      const project = await storage.createProject(projectData);

      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Project creation error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, updateData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Configuration routes
  app.get("/api/projects/:projectId/configurations", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const configurations = await storage.getConfigurationsByProject(projectId);
      res.json(configurations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configurations" });
    }
  });

  app.post("/api/projects/:projectId/configurations", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const configData = insertConfigurationSchema.parse({
        ...req.body,
        projectId
      });
      const configuration = await storage.createConfiguration(configData);
      res.json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create configuration" });
    }
  });

  app.put("/api/configurations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertConfigurationSchema.partial().parse(req.body);
      const configuration = await storage.updateConfiguration(id, updateData);
      res.json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  // Analysis routes
  app.get("/api/projects/:projectId/analyses", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const analyses = await storage.getAnalysesByProject(projectId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  app.post("/api/projects/:projectId/analyses", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const analysisData = insertAnalysisSchema.parse({
        ...req.body,
        projectId
      });
      const analysis = await storage.createAnalysis(analysisData);
      
      // Start analysis process asynchronously
      processAnalysis(analysis.id);
      
      res.json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid analysis data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create analysis" });
    }
  });

  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // DXF parsing and zone detection
  app.post("/api/dxf/parse", upload.single('dxfFile'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No DXF file provided" });
      }

      const dxfContent = fs.readFileSync(req.file.path, 'utf8');
      const parser = new DxfParser();
      const parsed = parser.parseSync(dxfContent);
      
      const processedData = await processDxfData(parsed);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json(processedData);
    } catch (error) {
      console.error("DXF parsing error:", error);
      res.status(500).json({ message: "Failed to parse DXF file" });
    }
  });

  // Export routes
  app.get("/api/analyses/:id/export/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // PDF generation would be implemented here
      res.json({ message: "PDF export not yet implemented", analysisId: id });
    } catch (error) {
      res.status(500).json({ message: "Failed to export PDF" });
    }
  });

  app.get("/api/analyses/:id/export/image", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Image generation would be implemented here
      res.json({ message: "Image export not yet implemented", analysisId: id });
    } catch (error) {
      res.status(500).json({ message: "Failed to export image" });
    }
  });

  // Export analysis to PDF
  app.get("/api/analysis/:id/export/pdf", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const project = await storage.getProject(analysis.projectId!);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const doc = new PDFDocument();
      const filename = `analysis_${analysis.id}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      
      // Add PDF content
      doc.fontSize(20).text('Floor Plan Analysis Report', 100, 100);
      doc.fontSize(14).text(`Project: ${project.name}`, 100, 150);
      doc.text(`Analysis Date: ${analysis.completedAt?.toLocaleDateString()}`, 100, 170);
      doc.text(`Total Îlots: ${analysis.totalIlots}`, 100, 190);
      doc.text(`Coverage: ${((analysis.coverage || 0) * 100).toFixed(1)}%`, 100, 210);
      
      // Add analysis visualization
      const ilotsData = analysis.ilotsPlaced as any[];
      const zonesData = analysis.zonesDetected as any;
      
      if (ilotsData && zonesData) {
        doc.addPage();
        doc.fontSize(16).text('Floor Plan Visualization', 100, 100);
        
        // Draw zones and îlots
        const scale = 3; // Scale factor for PDF
        const offsetX = 100;
        const offsetY = 150;
        
        // Draw walls
        if (zonesData.walls) {
          doc.strokeColor('#000000').lineWidth(2);
          zonesData.walls.forEach((wall: any) => {
            if (wall.coordinates && wall.coordinates.length >= 2) {
              doc.moveTo(offsetX + wall.coordinates[0][0] * scale, offsetY + wall.coordinates[0][1] * scale);
              for (let i = 1; i < wall.coordinates.length; i++) {
                doc.lineTo(offsetX + wall.coordinates[i][0] * scale, offsetY + wall.coordinates[i][1] * scale);
              }
              doc.stroke();
            }
          });
        }
        
        // Draw îlots
        ilotsData.forEach((ilot: any) => {
          doc.fillColor('#4A90E2').fillOpacity(0.3);
          doc.rect(offsetX + ilot.x * scale, offsetY + ilot.y * scale, ilot.width * scale, ilot.height * scale);
          doc.fill();
          
          // Add îlot label
          doc.fillColor('#000000').fillOpacity(1);
          doc.fontSize(8).text(ilot.type, offsetX + ilot.x * scale + 2, offsetY + ilot.y * scale + 2);
        });
        
        // Draw corridors
        const corridorsData = analysis.corridorsGenerated as any[];
        if (corridorsData) {
          corridorsData.forEach((corridor: any) => {
            doc.fillColor('#90EE90').fillOpacity(0.5);
            doc.rect(offsetX + corridor.x * scale, offsetY + corridor.y * scale, corridor.width * scale, corridor.height * scale);
            doc.fill();
          });
        }
      }
      
      doc.end();
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ message: "Failed to export PDF" });
    }
  });

  // Export analysis to PNG
  app.get("/api/analysis/:id/export/png", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const ilotsData = analysis.ilotsPlaced as any[];
      const zonesData = analysis.zonesDetected as any;
      
      if (!ilotsData || !zonesData) {
        return res.status(400).json({ message: "Analysis data incomplete" });
      }

      // Create image canvas
      const width = 800;
      const height = 600;
      const image = new Jimp({ width, height, color: 0xFFFFFFFF });
      
      // Calculate scale and offset
      const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
      if (zonesData.walls && zonesData.walls.length > 0) {
        const allCoords = zonesData.walls.flatMap((wall: any) => wall.coordinates || []);
        if (allCoords.length > 0) {
          bounds.minX = Math.min(...allCoords.map((c: number[]) => c[0]));
          bounds.minY = Math.min(...allCoords.map((c: number[]) => c[1]));
          bounds.maxX = Math.max(...allCoords.map((c: number[]) => c[0]));
          bounds.maxY = Math.max(...allCoords.map((c: number[]) => c[1]));
        }
      }
      
      const scaleX = (width - 100) / (bounds.maxX - bounds.minX);
      const scaleY = (height - 100) / (bounds.maxY - bounds.minY);
      const scale = Math.min(scaleX, scaleY);
      const offsetX = 50;
      const offsetY = 50;
      
      // Draw îlots
      ilotsData.forEach((ilot: any) => {
        const x = Math.round(offsetX + (ilot.x - bounds.minX) * scale);
        const y = Math.round(offsetY + (ilot.y - bounds.minY) * scale);
        const w = Math.round(ilot.width * scale);
        const h = Math.round(ilot.height * scale);
        
        // Draw îlot rectangle
        for (let i = 0; i < w; i++) {
          for (let j = 0; j < h; j++) {
            if (x + i < width && y + j < height) {
              image.setPixelColor(0x4A90E2FF, x + i, y + j);
            }
          }
        }
      });
      
      // Draw corridors
      const corridorsData = analysis.corridorsGenerated as any[];
      if (corridorsData) {
        corridorsData.forEach((corridor: any) => {
          const x = Math.round(offsetX + (corridor.x - bounds.minX) * scale);
          const y = Math.round(offsetY + (corridor.y - bounds.minY) * scale);
          const w = Math.round(corridor.width * scale);
          const h = Math.round(corridor.height * scale);
          
          // Draw corridor rectangle
          for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
              if (x + i < width && y + j < height) {
                image.setPixelColor(0x90EE90FF, x + i, y + j);
              }
            }
          }
        });
      }
      
      const buffer = await image.getBuffer('image/png');
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="analysis_${analysis.id}.png"`);
      res.send(buffer);
    } catch (error) {
      console.error("PNG export error:", error);
      res.status(500).json({ message: "Failed to export PNG" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Real DXF processing function
async function processDxfData(dxf: any) {
  const zones = {
    walls: [] as any[],
    restricted: [] as any[],
    entrances: [] as any[]
  };

  let bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };

  // Process entities from all layers
  if (dxf.entities) {
    dxf.entities.forEach((entity: any) => {
      // Update bounds
      if (entity.vertices) {
        entity.vertices.forEach((vertex: any) => {
          bounds.minX = Math.min(bounds.minX, vertex.x);
          bounds.minY = Math.min(bounds.minY, vertex.y);
          bounds.maxX = Math.max(bounds.maxX, vertex.x);
          bounds.maxY = Math.max(bounds.maxY, vertex.y);
        });
      }

      // Classify entities based on layer names and properties
      const layerName = entity.layer?.toLowerCase() || '';
      const color = entity.color || 0;

      if (entity.type === 'LINE' || entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') {
        const coordinates = extractCoordinates(entity);
        
        if (layerName.includes('wall') || layerName.includes('mur') || color === 0) {
          zones.walls.push({
            id: zones.walls.length + 1,
            type: 'wall',
            coordinates,
            color: '#000000',
            layer: entity.layer
          });
        } else if (layerName.includes('restricted') || layerName.includes('stair') || 
                   layerName.includes('elevator') || color === 4) {
          zones.restricted.push({
            id: zones.restricted.length + 1,
            type: 'restricted',
            coordinates,
            color: '#4A90E2',
            layer: entity.layer
          });
        } else if (layerName.includes('entrance') || layerName.includes('door') || 
                   layerName.includes('entry') || color === 1) {
          zones.entrances.push({
            id: zones.entrances.length + 1,
            type: 'entrance',
            coordinates,
            color: '#D0021B',
            layer: entity.layer
          });
        }
      }
    });
  }

  // Fix infinite bounds
  if (bounds.minX === Infinity) {
    bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  return {
    zones,
    bounds,
    layers: dxf.layers || [],
    entityCount: dxf.entities?.length || 0
  };
}

function extractCoordinates(entity: any): number[][] {
  const coords: number[][] = [];
  
  if (entity.type === 'LINE') {
    coords.push([entity.startPoint.x, entity.startPoint.y]);
    coords.push([entity.endPoint.x, entity.endPoint.y]);
  } else if (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') {
    if (entity.vertices) {
      entity.vertices.forEach((vertex: any) => {
        coords.push([vertex.x, vertex.y]);
      });
    }
  }
  
  return coords;
}

// Async function to process analysis
async function processAnalysis(analysisId: number) {
  try {
    await storage.updateAnalysis(analysisId, { status: "running" });
    
    const analysis = await storage.getAnalysis(analysisId);
    if (!analysis) throw new Error("Analysis not found");
    
    const project = await storage.getProject(analysis.projectId!);
    if (!project) throw new Error("Project not found");
    
    const configuration = await storage.getConfiguration(analysis.configurationId!);
    if (!configuration) throw new Error("Configuration not found");

    // Get DXF data from project
    const dxfData = project.dxfData as any;
    let zonesDetected = null;
    
    if (dxfData?.parsed) {
      zonesDetected = dxfData.parsed.zones;
    } else {
      // Fallback to basic rectangular boundary if no DXF data
      zonesDetected = {
        walls: [
          { id: 1, type: "wall", coordinates: [[0, 0], [100, 0]], color: "#000000" },
          { id: 2, type: "wall", coordinates: [[100, 0], [100, 100]], color: "#000000" },
          { id: 3, type: "wall", coordinates: [[100, 100], [0, 100]], color: "#000000" },
          { id: 4, type: "wall", coordinates: [[0, 100], [0, 0]], color: "#000000" }
        ],
        restricted: [],
        entrances: []
      };
    }

    // Calculate available area
    const bounds = dxfData?.parsed?.bounds || { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const totalArea = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
    
    // Generate îlots based on configuration
    const ilotDistribution = configuration.ilotDistribution as any;
    const ilotsPlaced = generateIlots(bounds, zonesDetected, ilotDistribution, configuration);
    
    // Generate corridors
    const corridorsGenerated = generateCorridors(ilotsPlaced, configuration.corridorWidth || 1.5);
    
    // Calculate coverage
    const usedArea = ilotsPlaced.reduce((sum: number, ilot: any) => sum + ilot.area, 0);
    const coverage = Math.min(usedArea / totalArea, 1.0);

    const results = {
      status: "completed",
      zonesDetected,
      ilotsPlaced,
      corridorsGenerated,
      totalIlots: ilotsPlaced.length,
      coverage,
      completedAt: new Date()
    };
    
    await storage.updateAnalysis(analysisId, results);
  } catch (error) {
    console.error("Analysis processing failed:", error);
    await storage.updateAnalysis(analysisId, { 
      status: "failed", 
      completedAt: new Date() 
    });
  }
}

function generateIlots(bounds: any, zones: any, distribution: any, config: any) {
  const ilots: any[] = [];
  const obstacles: any[] = [];
  
  // Convert zones to obstacles
  [...zones.walls, ...zones.restricted, ...zones.entrances].forEach((zone: any) => {
    if (zone.coordinates && zone.coordinates.length >= 2) {
      const xs = zone.coordinates.map((c: number[]) => c[0]);
      const ys = zone.coordinates.map((c: number[]) => c[1]);
      obstacles.push({
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys)
      });
    }
  });

  // Define size ranges
  const sizeRanges = [
    { key: 'size0to1', min: 0.5, max: 1.0, percentage: distribution.size0to1 || 0 },
    { key: 'size1to3', min: 1.0, max: 3.0, percentage: distribution.size1to3 || 0 },
    { key: 'size3to5', min: 3.0, max: 5.0, percentage: distribution.size3to5 || 0 },
    { key: 'size5to10', min: 5.0, max: 10.0, percentage: distribution.size5to10 || 0 }
  ];

  let currentId = 1;
  const availableArea = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
  
  sizeRanges.forEach(range => {
    if (range.percentage === 0) return;
    
    const targetArea = availableArea * (range.percentage / 100);
    let placedArea = 0;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (placedArea < targetArea && attempts < maxAttempts) {
      attempts++;
      
      // Generate random îlot size within range
      const area = Math.random() * (range.max - range.min) + range.min;
      const aspectRatio = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
      
      const width = Math.sqrt(area / aspectRatio);
      const height = area / width;
      
      // Try to place the îlot
      const position = findAvailablePosition(bounds, obstacles, ilots, width, height);
      
      if (position) {
        const ilot = {
          id: currentId++,
          x: position.x,
          y: position.y,
          width,
          height,
          area,
          type: range.key.replace('size', '') + 'm²'
        };
        
        ilots.push(ilot);
        placedArea += area;
        
        // Add placed îlot as obstacle for future placements
        obstacles.push({
          minX: ilot.x,
          minY: ilot.y,
          maxX: ilot.x + ilot.width,
          maxY: ilot.y + ilot.height
        });
      }
    }
  });

  return ilots;
}

function findAvailablePosition(bounds: any, obstacles: any[], existingIlots: any[], width: number, height: number) {
  const step = Math.min(width, height) / 4; // Adaptive step size
  const clearance = 0.5; // Minimum clearance
  
  for (let y = bounds.minY; y <= bounds.maxY - height; y += step) {
    for (let x = bounds.minX; x <= bounds.maxX - width; x += step) {
      const testRect = {
        minX: x - clearance,
        minY: y - clearance,
        maxX: x + width + clearance,
        maxY: y + height + clearance
      };
      
      // Check collision with obstacles
      const hasCollision = obstacles.some(obstacle => 
        !(testRect.maxX < obstacle.minX || 
          testRect.minX > obstacle.maxX || 
          testRect.maxY < obstacle.minY || 
          testRect.minY > obstacle.maxY)
      );
      
      if (!hasCollision) {
        return { x, y };
      }
    }
  }
  
  return null;
}

function generateCorridors(ilots: any[], corridorWidth: number) {
  const corridors: any[] = [];
  let currentId = 1;
  
  // Group îlots by rows (similar Y coordinates)
  const rows: any[][] = [];
  const tolerance = corridorWidth * 2;
  
  ilots.forEach(ilot => {
    let addedToRow = false;
    for (const row of rows) {
      if (Math.abs(row[0].y - ilot.y) < tolerance) {
        row.push(ilot);
        addedToRow = true;
        break;
      }
    }
    if (!addedToRow) {
      rows.push([ilot]);
    }
  });
  
  // Sort îlots within each row by X coordinate
  rows.forEach(row => row.sort((a, b) => a.x - b.x));
  
  // Generate horizontal corridors between îlots in the same row
  rows.forEach(row => {
    for (let i = 0; i < row.length - 1; i++) {
      const ilot1 = row[i];
      const ilot2 = row[i + 1];
      
      const gap = ilot2.x - (ilot1.x + ilot1.width);
      if (gap > corridorWidth) {
        corridors.push({
          id: currentId++,
          x: ilot1.x + ilot1.width,
          y: Math.min(ilot1.y, ilot2.y),
          width: gap,
          height: corridorWidth,
          type: 'corridor'
        });
      }
    }
  });
  
  // Generate vertical corridors between rows
  for (let i = 0; i < rows.length - 1; i++) {
    const row1 = rows[i];
    const row2 = rows[i + 1];
    
    const minY1 = Math.min(...row1.map(ilot => ilot.y + ilot.height));
    const maxY2 = Math.max(...row2.map(ilot => ilot.y));
    
    if (maxY2 - minY1 > corridorWidth) {
      const minX = Math.min(...row1.map(ilot => ilot.x), ...row2.map(ilot => ilot.x));
      const maxX = Math.max(...row1.map(ilot => ilot.x + ilot.width), ...row2.map(ilot => ilot.x + ilot.width));
      
      corridors.push({
        id: currentId++,
        x: minX,
        y: minY1,
        width: maxX - minX,
        height: maxY2 - minY1,
        type: 'corridor'
      });
    }
  }
  
  return corridors;
}
