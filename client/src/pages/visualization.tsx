import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  ZoomIn, ZoomOut, Maximize, Download, Grid3x3, Move, 
  Square, Layers, Eye, EyeOff, Palette 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Project, Analysis } from "@shared/schema";

export default function Visualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState("pan");
  const [showGrid, setShowGrid] = useState(true);
  const [layers, setLayers] = useState({
    walls: true,
    ilots: true,
    corridors: true,
    restricted: true,
    entrances: true
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects']
  });

  const currentProject = projects[0];

  const { data: analyses = [] } = useQuery<Analysis[]>({
    queryKey: ['/api/projects', currentProject?.id, 'analyses'],
    enabled: !!currentProject?.id
  });

  const currentAnalysis = analyses[0];

  useEffect(() => {
    if (!canvasRef.current || !currentProject) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x + canvas.width / 2, pan.y + canvas.height / 2);
    ctx.scale(zoom, zoom);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 0.5;
      for (let x = -1000; x <= 1000; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, -1000);
        ctx.lineTo(x, 1000);
        ctx.stroke();
      }
      for (let y = -1000; y <= 1000; y += 20) {
        ctx.beginPath();
        ctx.moveTo(-1000, y);
        ctx.lineTo(1000, y);
        ctx.stroke();
      }
    }

    // Draw floor plan elements
    if (currentAnalysis?.zonesDetected) {
      // Draw walls
      if (layers.walls && currentAnalysis.zonesDetected.walls) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        currentAnalysis.zonesDetected.walls.forEach((wall: any) => {
          ctx.beginPath();
          wall.coordinates.forEach((coord: number[], idx: number) => {
            if (idx === 0) ctx.moveTo(coord[0], coord[1]);
            else ctx.lineTo(coord[0], coord[1]);
          });
          ctx.closePath();
          ctx.stroke();
        });
      }

      // Draw restricted areas
      if (layers.restricted && currentAnalysis.zonesDetected.restricted) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        currentAnalysis.zonesDetected.restricted.forEach((area: any) => {
          ctx.beginPath();
          area.coordinates.forEach((coord: number[], idx: number) => {
            if (idx === 0) ctx.moveTo(coord[0], coord[1]);
            else ctx.lineTo(coord[0], coord[1]);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      }
    }

    // Draw îlots
    if (layers.ilots && currentAnalysis?.ilotsPlaced) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      currentAnalysis.ilotsPlaced.forEach((ilot: any) => {
        ctx.fillRect(ilot.x, ilot.y, ilot.width, ilot.height);
        ctx.strokeRect(ilot.x, ilot.y, ilot.width, ilot.height);
      });
    }

    // Draw corridors
    if (layers.corridors && currentAnalysis?.corridorsGenerated) {
      ctx.fillStyle = 'rgba(251, 146, 60, 0.3)';
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 1;
      currentAnalysis.corridorsGenerated.forEach((corridor: any) => {
        ctx.fillRect(corridor.x, corridor.y, corridor.width, corridor.height);
        ctx.strokeRect(corridor.x, corridor.y, corridor.width, corridor.height);
      });
    }

    ctx.restore();
  }, [zoom, pan, showGrid, layers, currentProject, currentAnalysis]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleFitToScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex h-screen bg-dark-primary">
      {/* Toolbar */}
      <div className="w-16 bg-dark-secondary border-r border-dark-tertiary p-4 flex flex-col gap-4">
        <ToggleGroup type="single" value={selectedTool} onValueChange={setSelectedTool}>
          <ToggleGroupItem value="pan" className="w-full">
            <Move className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="select" className="w-full">
            <Square className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="h-px bg-dark-tertiary" />

        <Button variant="ghost" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleFitToScreen}>
          <Maximize className="h-4 w-4" />
        </Button>

        <div className="h-px bg-dark-tertiary" />

        <Button variant="ghost" size="icon" onClick={() => setShowGrid(!showGrid)}>
          <Grid3x3 className={`h-4 w-4 ${showGrid ? 'text-accent-blue' : ''}`} />
        </Button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onWheel={(e) => {
            e.preventDefault();
            if (e.deltaY < 0) handleZoomIn();
            else handleZoomOut();
          }}
        />

        {/* Zoom indicator */}
        <div className="absolute top-4 left-4 bg-dark-secondary rounded-lg px-3 py-2 text-sm text-text-primary">
          Zoom: {Math.round(zoom * 100)}%
        </div>

        {/* Export buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="sm" variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button size="sm" variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Export Image
          </Button>
        </div>
      </div>

      {/* Layers Panel */}
      <div className="w-80 bg-dark-secondary border-l border-dark-tertiary p-6">
        <Card className="bg-dark-tertiary border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-text-primary flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(layers).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label htmlFor={key} className="text-sm text-text-primary capitalize">
                  {key}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}
                >
                  {value ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-dark-tertiary border-0 mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-text-primary flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Visual Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary">Grid Opacity</label>
              <Slider
                value={[100]}
                max={100}
                step={10}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Îlot Opacity</label>
              <Slider
                value={[30]}
                max={100}
                step={10}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}