import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertProjectSchema, insertConfigurationSchema, insertAnalysisSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
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

  app.post("/api/projects", upload.single('dxfFile'), async (req, res) => {
    try {
      const { name, description } = req.body;
      const dxfData = req.file ? {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      } : null;

      const projectData = insertProjectSchema.parse({
        name,
        description,
        dxfData,
        floorPlanImage: null
      });

      // For now, use a default user ID - in production, this would come from authentication
      const project = await storage.createProject({
        ...projectData,
        userId: 1
      });

      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
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
  app.post("/api/dxf/parse", upload.single('dxfFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No DXF file provided" });
      }

      // Basic DXF parsing response - in production, this would use actual DXF parsing libraries
      const parsedData = {
        zones: {
          walls: [],
          restricted: [],
          entrances: []
        },
        bounds: {
          minX: 0,
          minY: 0,
          maxX: 100,
          maxY: 100
        },
        layers: []
      };

      res.json(parsedData);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}

// Async function to process analysis
async function processAnalysis(analysisId: number) {
  try {
    // Update status to running
    await storage.updateAnalysis(analysisId, { status: "running" });
    
    // Simulate analysis processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Mock analysis results
    const mockResults = {
      status: "completed",
      zonesDetected: {
        walls: [
          { id: 1, type: "wall", coordinates: [[0, 0], [100, 0]], color: "#000000" },
          { id: 2, type: "wall", coordinates: [[100, 0], [100, 100]], color: "#000000" },
          { id: 3, type: "wall", coordinates: [[100, 100], [0, 100]], color: "#000000" },
          { id: 4, type: "wall", coordinates: [[0, 100], [0, 0]], color: "#000000" }
        ],
        restricted: [
          { id: 1, type: "restricted", coordinates: [[10, 10], [20, 10], [20, 20], [10, 20]], color: "#4A90E2" }
        ],
        entrances: [
          { id: 1, type: "entrance", coordinates: [[45, 0], [55, 0]], color: "#D0021B" }
        ]
      },
      ilotsPlaced: [
        { id: 1, x: 30, y: 30, width: 15, height: 10, area: 150, type: "3-5m²" },
        { id: 2, x: 50, y: 30, width: 20, height: 15, area: 300, type: "5-10m²" }
      ],
      corridorsGenerated: [
        { id: 1, x: 25, y: 25, width: 40, height: 5, type: "corridor" }
      ],
      totalIlots: 2,
      coverage: 0.45,
      completedAt: new Date()
    };
    
    await storage.updateAnalysis(analysisId, mockResults);
  } catch (error) {
    console.error("Analysis processing failed:", error);
    await storage.updateAnalysis(analysisId, { 
      status: "failed", 
      completedAt: new Date() 
    });
  }
}
