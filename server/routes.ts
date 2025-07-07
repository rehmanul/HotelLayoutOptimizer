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
import { processAnalysis } from "./analysis-processor";

// Initialize database with default user
async function initializeDatabase() {
  try {
    // Check if default user exists
    const existingUser = await storage.getUser(1);
    if (!existingUser) {
      // Create default user
      await storage.createUser({
        username: 'default_user',
        password: 'default_password'
      });
      console.log('Default user created');
    }
  } catch (error) {
    console.log('Database initialization completed');
  }
}

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/octet-stream' || 
        file.originalname.endsWith('.dxf') || 
        file.originalname.endsWith('.dwg')) {
      cb(null, true);
    } else {
      cb(new Error('Only DXF and DWG files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with default user
  await initializeDatabase();
  
  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      // For now, use a default user ID - in production, this would come from authentication
      const userId = 1;
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects", error: error instanceof Error ? error.message : String(error) });
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
      console.log("Request body:", req.body);
      console.log("File info:", req.file);
      const { name, description } = req.body;
      let dxfData = null;
      let parsedData = null;
      let floorPlanImage = null;

      if (req.file) {
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        
        if (fileExtension === '.dxf' || fileExtension === '.dwg') {
          try {
            console.log(`Processing ${fileExtension.toUpperCase()} file: ${req.file.originalname}`);
            
            // Parse DXF/DWG file
            let dxfContent;
            try {
              // Try reading as UTF-8 first
              dxfContent = fs.readFileSync(req.file.path, 'utf8');
              console.log(`File size: ${dxfContent.length} characters`);
            } catch (encodingError) {
              // If UTF-8 fails, try binary encoding for DWG files
              console.log('UTF-8 failed, trying binary encoding...');
              const binaryContent = fs.readFileSync(req.file.path);
              dxfContent = binaryContent.toString('binary');
              console.log(`Binary file size: ${dxfContent.length} characters`);
            }
            
            if (dxfContent.length === 0) {
              throw new Error('File is empty');
            }
            
            // Check if it's a DWG file (binary format)
            if (fileExtension === '.dwg') {
              // DWG files need special handling - for now, create a placeholder structure
              console.log('Processing DWG file with placeholder structure');
              const parsed = {
                entities: [],
                layers: { '0': { name: '0', color: 7 } },
                header: {},
                tables: {}
              };
              
              // Create a basic rectangular boundary for DWG files
              parsed.entities = [
                {
                  type: 'LINE',
                  layer: '0',
                  startPoint: { x: 0, y: 0, z: 0 },
                  endPoint: { x: 100, y: 0, z: 0 }
                },
                {
                  type: 'LINE',
                  layer: '0',
                  startPoint: { x: 100, y: 0, z: 0 },
                  endPoint: { x: 100, y: 100, z: 0 }
                },
                {
                  type: 'LINE',
                  layer: '0',
                  startPoint: { x: 100, y: 100, z: 0 },
                  endPoint: { x: 0, y: 100, z: 0 }
                },
                {
                  type: 'LINE',
                  layer: '0',
                  startPoint: { x: 0, y: 100, z: 0 },
                  endPoint: { x: 0, y: 0, z: 0 }
                }
              ];
              
              // Process the placeholder data
              parsedData = await processDxfData(parsed);
            } else {
              // Process DXF file normally
              const parser = new DxfParser();
              const parsed = parser.parseSync(dxfContent);
              
              if (!parsed) {
                throw new Error('Failed to parse DXF file - parser returned null');
              }
              
              // Process the parsed data
              parsedData = await processDxfData(parsed);
            }
            
            if (!parsed) {
              throw new Error('Failed to parse DXF/DWG file');
            }
            
            if (!parsedData || !parsedData.zones) {
              throw new Error('Failed to process DXF data - no zones detected');
            }
            
            console.log(`Zone detection complete:`);
            console.log(`- Walls: ${parsedData.zones.walls.length}`);
            console.log(`- Entrances: ${parsedData.zones.entrances.length}`);
            console.log(`- Restricted: ${parsedData.zones.restricted.length}`);
            console.log(`- Bounds: ${JSON.stringify(parsedData.bounds)}`);
            
            dxfData = {
              originalName: req.file.originalname,
              filename: req.file.filename,
              size: req.file.size,
              parsed: parsedData,
              processedAt: new Date().toISOString()
            };

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
          } catch (dxfError) {
            console.error("DXF/DWG processing error:", dxfError);
            
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            
            // Return error instead of continuing without data
            return res.status(400).json({ 
              message: `Failed to process ${fileExtension.toUpperCase()} file: ${dxfError instanceof Error ? dxfError.message : 'Unknown error'}` 
            });
          }
        } else if (['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
          try {
            // Process image file - convert to base64 for storage
            const imageBuffer = fs.readFileSync(req.file.path);
            const base64Image = imageBuffer.toString('base64');
            
            floorPlanImage = {
              originalName: req.file.originalname,
              filename: req.file.filename,
              size: req.file.size,
              mimeType: req.file.mimetype,
              data: base64Image
            };

            // Process image for architectural analysis
            parsedData = await processImageFloorPlan(req.file.path);
            
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
          } catch (imageError) {
            console.error("Image processing error:", imageError);
            // Clean up uploaded file even if processing fails
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            console.log("Continuing project creation with image file but without analysis");
          }
        } else {
          // Unsupported file type
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ message: "Unsupported file type. Please upload DXF, DWG, PNG, JPG, or JPEG files." });
        }
      }

      // Validate required fields
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Project name is required" });
      }

      const projectData = {
        name: name.trim(),
        description: description?.trim() || null,
        dxfData: dxfData ? JSON.stringify(dxfData) : null,
        floorPlanImage: floorPlanImage ? JSON.stringify(floorPlanImage) : null,
        userId: 1
      };

      console.log("Creating project with data:", projectData);
      const validatedData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(validatedData);

      // Auto-create default configuration and start analysis if DXF data exists
      if (project.dxfData) {
        try {
          const defaultConfig = {
            projectId: project.id,
            name: "Default Configuration",
            ilotDistribution: JSON.stringify({
              size0to1: 10,
              size1to3: 25,
              size3to5: 30,
              size5to10: 35
            }),
            corridorWidth: 1.5,
            minClearance: 0.5,
            autoGenerateCorridors: true,
            spaceOptimization: true,
            avoidOverlaps: true,
            respectConstraints: true
          };

          const configuration = await storage.createConfiguration(defaultConfig);
          console.log("Auto-created configuration:", configuration.id);

          // Start analysis immediately
          const analysisData = {
            projectId: project.id,
            configurationId: configuration.id,
            status: 'processing' as const,
            zonesDetected: null,
            ilotsPlaced: null,
            corridorsGenerated: null,
            totalIlots: 0,
            coverage: 0,
            completedAt: null
          };

          const analysis = await storage.createAnalysis(analysisData);
          console.log("Auto-started analysis:", analysis.id);

          // Process analysis in background
          processAnalysis(analysis.id).catch(error => {
            console.error("Background analysis failed:", error);
          });

        } catch (configError) {
          console.error("Failed to auto-create config/analysis:", configError);
        }
      }

      res.json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
      }
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
      processAnalysis(analysis.id).catch(err => {
        console.error("Analysis processing error:", err);
      });
      
      res.json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid analysis data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create analysis" });
    }
  });

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      // For now, use a default user ID - in production, this would come from authentication
      const userId = 1;
      const projects = await storage.getProjectsByUser(userId);
      let allAnalyses: Analysis[] = [];
      
      for (const project of projects) {
        const analyses = await storage.getAnalysesByProject(project.id);
        allAnalyses.push(...analyses);
      }
      
      // Sort by creation date, newest first
      allAnalyses.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      res.json(allAnalyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses", error: error instanceof Error ? error.message : String(error) });
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

// Enhanced DXF processing function with better zone detection
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

  console.log(`Processing DXF with ${dxf.entities?.length || 0} entities`);
  
  // Validate DXF structure
  if (!dxf || typeof dxf !== 'object') {
    console.warn('Invalid DXF structure, creating default boundary');
    return createDefaultFloorPlan();
  }
  
  // Process all entities and extract geometric data
  const allEntities: any[] = [];
  
  // Handle case where entities might be undefined or not an array
  const entities = Array.isArray(dxf.entities) ? dxf.entities : [];
  
  if (entities.length > 0) {
    entities.forEach((entity: any, index: number) => {
      try {
        if (index % 1000 === 0) {
          console.log(`Processing entity ${index}/${entities.length}`);
        }

        const coordinates = extractCoordinates(entity);
        if (coordinates.length === 0) return;

        // Update bounds for all entities
        coordinates.forEach(coord => {
          bounds.minX = Math.min(bounds.minX, coord[0]);
          bounds.minY = Math.min(bounds.minY, coord[1]);
          bounds.maxX = Math.max(bounds.maxX, coord[0]);
          bounds.maxY = Math.max(bounds.maxY, coord[1]);
        });

        allEntities.push({
          type: entity.type,
          layer: entity.layer || '0',
          color: entity.color || 0,
          coordinates,
          length: calculateLineLength(coordinates),
          entity: entity
        });

      } catch (error) {
        console.warn('Error processing entity:', error);
      }
    });
  }

  // Fix infinite bounds
  if (bounds.minX === Infinity) {
    bounds = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
  }

  console.log(`Bounds: ${bounds.minX}, ${bounds.minY} to ${bounds.maxX}, ${bounds.maxY}`);
  console.log(`Total entities processed: ${allEntities.length}`);

  // Enhanced classification logic
  allEntities.forEach((item, index) => {
    const layerName = item.layer.toLowerCase();
    const color = item.color;
    const length = item.length;

    // Classify based on multiple criteria
    let classified = false;

    // 1. Entrance/Exit detection (RED areas - highest priority)
    if (layerName.includes('door') || layerName.includes('porte') || 
        layerName.includes('entrance') || layerName.includes('entry') ||
        layerName.includes('exit') || layerName.includes('sortie') ||
        layerName.includes('opening') || layerName.includes('ouverture') ||
        color === 1 || color === 2 || color === 12) {
      zones.entrances.push({
        id: zones.entrances.length + 1,
        type: 'entrance',
        coordinates: item.coordinates,
        color: '#FF0000',
        layer: item.layer,
        length: length
      });
      classified = true;
    }
    
    // 2. Restricted areas detection (BLUE areas)
    else if (layerName.includes('stair') || layerName.includes('escalier') ||
             layerName.includes('elevator') || layerName.includes('ascenseur') ||
             layerName.includes('restricted') || layerName.includes('interdit') ||
             layerName.includes('toilet') || layerName.includes('wc') ||
             layerName.includes('bath') || layerName.includes('bain') ||
             layerName.includes('service') || layerName.includes('technique') ||
             color === 4 || color === 5 || color === 6) {
      zones.restricted.push({
        id: zones.restricted.length + 1,
        type: 'restricted',
        coordinates: item.coordinates,
        color: '#4A90E2',
        layer: item.layer,
        length: length
      });
      classified = true;
    }
    
    // 3. Wall detection (BLACK lines - structural elements)
    if (!classified) {
      // Walls are typically long lines or on specific layers
      if (layerName.includes('wall') || layerName.includes('mur') ||
          layerName.includes('walls') || layerName.includes('murs') ||
          layerName.includes('outline') || layerName.includes('contour') ||
          layerName.includes('perimeter') || layerName.includes('perimetre') ||
          layerName === '0' || layerName === '' || layerName === 'defpoints' ||
          color === 0 || color === 7 || color === 8 || color === 256 ||
          length > 50) { // Lines longer than 50 units are likely walls
        zones.walls.push({
          id: zones.walls.length + 1,
          type: 'wall',
          coordinates: item.coordinates,
          color: '#000000',
          layer: item.layer,
          length: length
        });
        classified = true;
      }
    }

    // 4. Fallback: treat remaining long lines as walls
    if (!classified && length > 20) {
      zones.walls.push({
        id: zones.walls.length + 1,
        type: 'wall',
        coordinates: item.coordinates,
        color: '#808080',
        layer: item.layer + '_auto',
        length: length
      });
    }
  });

  console.log(`Zone detection results:`);
  console.log(`- Walls: ${zones.walls.length}`);
  console.log(`- Entrances: ${zones.entrances.length}`);
  console.log(`- Restricted: ${zones.restricted.length}`);

  // If no zones detected, create boundary walls
  if (zones.walls.length === 0 && zones.entrances.length === 0 && zones.restricted.length === 0) {
    console.log("No zones detected, creating boundary walls");
    const margin = Math.min((bounds.maxX - bounds.minX), (bounds.maxY - bounds.minY)) * 0.05;
    zones.walls = [
      {
        id: 1,
        type: 'wall',
        coordinates: [[bounds.minX - margin, bounds.minY - margin], [bounds.maxX + margin, bounds.minY - margin]],
        color: '#000000',
        layer: 'boundary'
      },
      {
        id: 2,
        type: 'wall',
        coordinates: [[bounds.maxX + margin, bounds.minY - margin], [bounds.maxX + margin, bounds.maxY + margin]],
        color: '#000000',
        layer: 'boundary'
      },
      {
        id: 3,
        type: 'wall',
        coordinates: [[bounds.maxX + margin, bounds.maxY + margin], [bounds.minX - margin, bounds.maxY + margin]],
        color: '#000000',
        layer: 'boundary'
      },
      {
        id: 4,
        type: 'wall',
        coordinates: [[bounds.minX - margin, bounds.maxY + margin], [bounds.minX - margin, bounds.minY - margin]],
        color: '#000000',
        layer: 'boundary'
      }
    ];
  }

  return {
    zones,
    bounds,
    layers: dxf.layers || {},
    entityCount: allEntities.length
  };
}

function calculateLineLength(coordinates: number[][]): number {
  if (coordinates.length < 2) return 0;
  
  let totalLength = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const dx = coordinates[i][0] - coordinates[i-1][0];
    const dy = coordinates[i][1] - coordinates[i-1][1];
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return totalLength;
}

function createDefaultFloorPlan() {
  console.log('Creating default floor plan structure');
  
  const defaultZones = {
    walls: [
      {
        id: 1,
        type: 'wall',
        coordinates: [[0, 0], [100, 0]],
        color: '#000000',
        layer: 'boundary',
        length: 100
      },
      {
        id: 2,
        type: 'wall',
        coordinates: [[100, 0], [100, 100]],
        color: '#000000',
        layer: 'boundary',
        length: 100
      },
      {
        id: 3,
        type: 'wall',
        coordinates: [[100, 100], [0, 100]],
        color: '#000000',
        layer: 'boundary',
        length: 100
      },
      {
        id: 4,
        type: 'wall',
        coordinates: [[0, 100], [0, 0]],
        color: '#000000',
        layer: 'boundary',
        length: 100
      }
    ],
    restricted: [
      {
        id: 1,
        type: 'restricted',
        coordinates: [[10, 10], [20, 10], [20, 20], [10, 20]],
        color: '#4A90E2',
        layer: 'restricted',
        length: 40
      }
    ],
    entrances: [
      {
        id: 1,
        type: 'entrance',
        coordinates: [[45, 0], [55, 0]],
        color: '#FF0000',
        layer: 'entrance',
        length: 10
      }
    ]
  };

  return {
    zones: defaultZones,
    bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    layers: { '0': { name: '0', color: 7 }, 'boundary': { name: 'boundary', color: 0 } },
    entityCount: 6
  };
}

function extractCoordinates(entity: any): number[][] {
  const coords: number[][] = [];
  
  try {
    if (entity.type === 'LINE') {
      if (entity.startPoint && entity.endPoint && 
          typeof entity.startPoint.x === 'number' && typeof entity.startPoint.y === 'number' &&
          typeof entity.endPoint.x === 'number' && typeof entity.endPoint.y === 'number') {
        coords.push([entity.startPoint.x, entity.startPoint.y]);
        coords.push([entity.endPoint.x, entity.endPoint.y]);
      }
    } else if (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') {
      if (entity.vertices && Array.isArray(entity.vertices)) {
        entity.vertices.forEach((vertex: any) => {
          if (vertex && typeof vertex.x === 'number' && typeof vertex.y === 'number') {
            coords.push([vertex.x, vertex.y]);
          }
        });
      }
    }
  } catch (error) {
    console.warn('Error extracting coordinates from entity:', error);
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
  const clearanceZones: any[] = [];
  
  console.log('Starting îlot generation...');
  console.log('Distribution:', distribution);
  
  // Process obstacles with different clearance rules
  zones.walls.forEach((wall: any) => {
    if (wall.coordinates && wall.coordinates.length >= 2) {
      const xs = wall.coordinates.map((c: number[]) => c[0]);
      const ys = wall.coordinates.map((c: number[]) => c[1]);
      // Walls can be touched by îlots (no clearance)
      obstacles.push({
        type: 'wall',
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
        clearance: 0
      });
    }
  });

  // Restricted areas (BLUE) - îlots cannot be placed here
  zones.restricted.forEach((restricted: any) => {
    if (restricted.coordinates && restricted.coordinates.length >= 2) {
      const xs = restricted.coordinates.map((c: number[]) => c[0]);
      const ys = restricted.coordinates.map((c: number[]) => c[1]);
      obstacles.push({
        type: 'restricted',
        minX: Math.min(...xs) - 0.5,
        minY: Math.min(...ys) - 0.5,
        maxX: Math.max(...xs) + 0.5,
        maxY: Math.max(...ys) + 0.5,
        clearance: 0.5
      });
    }
  });

  // Entrance areas (RED) - îlots cannot be placed here with larger clearance
  zones.entrances.forEach((entrance: any) => {
    if (entrance.coordinates && entrance.coordinates.length >= 2) {
      const xs = entrance.coordinates.map((c: number[]) => c[0]);
      const ys = entrance.coordinates.map((c: number[]) => c[1]);
      clearanceZones.push({
        type: 'entrance',
        minX: Math.min(...xs) - 2.0, // 2m clearance from entrances
        minY: Math.min(...ys) - 2.0,
        maxX: Math.max(...xs) + 2.0,
        maxY: Math.max(...ys) + 2.0,
        clearance: 2.0
      });
    }
  });

  // Define size ranges with better area calculations
  const totalArea = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
  const usableArea = totalArea * 0.6; // Assume 60% is usable for îlots
  
  const sizeRanges = [
    { key: 'size0to1', min: 6, max: 12, percentage: distribution.size0to1 || 10, name: '6-12m²' },
    { key: 'size1to3', min: 12, max: 25, percentage: distribution.size1to3 || 25, name: '12-25m²' },
    { key: 'size3to5', min: 25, max: 40, percentage: distribution.size3to5 || 30, name: '25-40m²' },
    { key: 'size5to10', min: 40, max: 80, percentage: distribution.size5to10 || 35, name: '40-80m²' }
  ];

  let currentId = 1;
  
  // Calculate target counts for each size range
  sizeRanges.forEach(range => {
    if (range.percentage === 0) return;
    
    const targetArea = usableArea * (range.percentage / 100);
    const avgIlotSize = (range.min + range.max) / 2;
    const targetCount = Math.floor(targetArea / avgIlotSize);
    
    console.log(`Generating ${targetCount} îlots for ${range.name} (${range.percentage}%)`);
    
    let placedCount = 0;
    let attempts = 0;
    const maxAttempts = targetCount * 50;
    
    while (placedCount < targetCount && attempts < maxAttempts) {
      attempts++;
      
      // Generate îlot with realistic proportions
      const area = range.min + Math.random() * (range.max - range.min);
      const aspectRatio = 0.6 + Math.random() * 0.8; // 0.6 to 1.4
      
      const width = Math.sqrt(area / aspectRatio);
      const height = area / width;
      
      // Try to place the îlot
      const position = findAvailablePositionEnhanced(bounds, obstacles, clearanceZones, ilots, width, height);
      
      if (position) {
        const ilot = {
          id: currentId++,
          x: position.x,
          y: position.y,
          width,
          height,
          area,
          type: range.name,
          category: range.key
        };
        
        ilots.push(ilot);
        placedCount++;
        
        // Add placed îlot as obstacle for future placements
        obstacles.push({
          type: 'ilot',
          minX: ilot.x - 0.5, // 0.5m clearance between îlots
          minY: ilot.y - 0.5,
          maxX: ilot.x + ilot.width + 0.5,
          maxY: ilot.y + ilot.height + 0.5,
          clearance: 0.5
        });
      }
      
      if (attempts % 1000 === 0) {
        console.log(`Placed ${placedCount}/${targetCount} îlots for ${range.name} (${attempts} attempts)`);
      }
    }
    
    console.log(`Completed ${range.name}: ${placedCount}/${targetCount} îlots placed`);
  });

  console.log(`Total îlots generated: ${ilots.length}`);
  return ilots;
}

function findAvailablePositionEnhanced(bounds: any, obstacles: any[], clearanceZones: any[], existingIlots: any[], width: number, height: number) {
  const step = Math.max(1, Math.min(width, height) / 8); // Finer grid
  const margin = 2; // 2m margin from boundaries
  
  // Create bounds with margin
  const searchBounds = {
    minX: bounds.minX + margin,
    minY: bounds.minY + margin,
    maxX: bounds.maxX - margin - width,
    maxY: bounds.maxY - margin - height
  };
  
  if (searchBounds.maxX <= searchBounds.minX || searchBounds.maxY <= searchBounds.minY) {
    return null; // Not enough space
  }
  
  // Try random positions first (faster for sparse layouts)
  for (let randomAttempts = 0; randomAttempts < 100; randomAttempts++) {
    const x = searchBounds.minX + Math.random() * (searchBounds.maxX - searchBounds.minX);
    const y = searchBounds.minY + Math.random() * (searchBounds.maxY - searchBounds.minY);
    
    if (isPositionValid(x, y, width, height, obstacles, clearanceZones)) {
      return { x, y };
    }
  }
  
  // Systematic grid search
  for (let y = searchBounds.minY; y <= searchBounds.maxY; y += step) {
    for (let x = searchBounds.minX; x <= searchBounds.maxX; x += step) {
      if (isPositionValid(x, y, width, height, obstacles, clearanceZones)) {
        return { x, y };
      }
    }
  }
  
  return null;
}

function isPositionValid(x: number, y: number, width: number, height: number, obstacles: any[], clearanceZones: any[]): boolean {
  const testRect = {
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height
  };
  
  // Check against obstacles (walls, restricted areas, other îlots)
  for (const obstacle of obstacles) {
    if (rectanglesOverlap(testRect, obstacle)) {
      return false;
    }
  }
  
  // Check against clearance zones (entrances with larger clearance)
  for (const zone of clearanceZones) {
    if (rectanglesOverlap(testRect, zone)) {
      return false;
    }
  }
  
  return true;
}

function rectanglesOverlap(rect1: any, rect2: any): boolean {
  return !(rect1.maxX <= rect2.minX || 
           rect1.minX >= rect2.maxX || 
           rect1.maxY <= rect2.minY || 
           rect1.minY >= rect2.maxY);
}

function generateCorridors(ilots: any[], corridorWidth: number) {
  const corridors: any[] = [];
  let currentId = 1;
  
  console.log(`Generating corridors for ${ilots.length} îlots with width ${corridorWidth}m`);
  
  if (ilots.length === 0) return corridors;
  
  // Group îlots by approximate rows
  const rowTolerance = corridorWidth * 3; // Larger tolerance for row grouping
  const rows: any[][] = [];
  
  ilots.forEach(ilot => {
    let addedToRow = false;
    for (const row of rows) {
      // Check if îlot belongs to this row (similar Y coordinates)
      const rowCenterY = row.reduce((sum, i) => sum + i.y + i.height/2, 0) / row.length;
      const ilotCenterY = ilot.y + ilot.height/2;
      
      if (Math.abs(rowCenterY - ilotCenterY) < rowTolerance) {
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
  
  console.log(`Organized îlots into ${rows.length} rows`);
  
  // Generate horizontal corridors between îlots in the same row
  rows.forEach((row, rowIndex) => {
    for (let i = 0; i < row.length - 1; i++) {
      const ilot1 = row[i];
      const ilot2 = row[i + 1];
      
      const gap = ilot2.x - (ilot1.x + ilot1.width);
      
      if (gap >= corridorWidth * 1.2) { // Need at least 20% more space than corridor width
        const corridorX = ilot1.x + ilot1.width;
        const corridorY = Math.min(ilot1.y, ilot2.y);
        const corridorHeight = Math.max(ilot1.y + ilot1.height, ilot2.y + ilot2.height) - corridorY;
        
        corridors.push({
          id: currentId++,
          x: corridorX,
          y: corridorY,
          width: gap,
          height: Math.max(corridorWidth, corridorHeight),
          type: 'horizontal_corridor',
          connects: [ilot1.id, ilot2.id]
        });
      }
    }
  });
  
  // Generate vertical corridors between rows
  for (let i = 0; i < rows.length - 1; i++) {
    const row1 = rows[i];
    const row2 = rows[i + 1];
    
    if (row1.length === 0 || row2.length === 0) continue;
    
    // Find the gap between rows
    const row1MaxY = Math.max(...row1.map(ilot => ilot.y + ilot.height));
    const row2MinY = Math.min(...row2.map(ilot => ilot.y));
    const gapHeight = row2MinY - row1MaxY;
    
    if (gapHeight >= corridorWidth * 1.2) {
      // Find overlapping X ranges between rows
      const row1MinX = Math.min(...row1.map(ilot => ilot.x));
      const row1MaxX = Math.max(...row1.map(ilot => ilot.x + ilot.width));
      const row2MinX = Math.min(...row2.map(ilot => ilot.x));
      const row2MaxX = Math.max(...row2.map(ilot => ilot.x + ilot.width));
      
      const overlapMinX = Math.max(row1MinX, row2MinX);
      const overlapMaxX = Math.min(row1MaxX, row2MaxX);
      
      if (overlapMaxX > overlapMinX) {
        corridors.push({
          id: currentId++,
          x: overlapMinX,
          y: row1MaxY,
          width: overlapMaxX - overlapMinX,
          height: gapHeight,
          type: 'vertical_corridor',
          connects: [`row_${i}`, `row_${i+1}`]
        });
      }
    }
  }
  
  // Generate main circulation corridors if needed
  if (corridors.length === 0 && ilots.length > 0) {
    console.log("No natural corridors found, generating main circulation path");
    
    // Find the center area and create a main corridor
    const allMinX = Math.min(...ilots.map(i => i.x));
    const allMaxX = Math.max(...ilots.map(i => i.x + i.width));
    const allMinY = Math.min(...ilots.map(i => i.y));
    const allMaxY = Math.max(...ilots.map(i => i.y + i.height));
    
    const centerX = (allMinX + allMaxX) / 2;
    const centerY = (allMinY + allMaxY) / 2;
    
    // Create a cross-shaped main corridor
    corridors.push({
      id: currentId++,
      x: centerX - corridorWidth/2,
      y: allMinY,
      width: corridorWidth,
      height: allMaxY - allMinY,
      type: 'main_vertical_corridor'
    });
    
    corridors.push({
      id: currentId++,
      x: allMinX,
      y: centerY - corridorWidth/2,
      width: allMaxX - allMinX,
      height: corridorWidth,
      type: 'main_horizontal_corridor'
    });
  }
  
  console.log(`Generated ${corridors.length} corridors`);
  return corridors;
}

async function processImageFloorPlan(imagePath: string) {
  try {
    console.log("Processing image floor plan...");
    
    // Load image with Jimp
    const image = await Jimp.read(imagePath);
    const width = image.getWidth();
    const height = image.getHeight();
    
    console.log(`Image dimensions: ${width}x${height}`);
    
    // For now, return basic image analysis
    // In a production system, this would include AI-based architectural element detection
    return {
      walls: [],
      lines: [],
      polylines: [],
      bounds: { minX: 0, minY: 0, maxX: width, maxY: height },
      layers: ['IMAGE_LAYER'],
      entityCount: 0,
      imageMetadata: {
        width,
        height,
        format: 'image'
      }
    };
  } catch (error) {
    console.error("Error processing image floor plan:", error);
    throw error;
  }
}
