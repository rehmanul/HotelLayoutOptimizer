import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project, Analysis } from "@shared/schema";

interface VisualizationAreaProps {
  currentProject: Project | null;
  currentAnalysis: Analysis | null;
  analyses: Analysis[];
}

interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedTool: string;
}

export default function VisualizationArea({
  currentProject,
  currentAnalysis,
  analyses
}: VisualizationAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    selectedTool: 'select'
  });

  const exportPdfMutation = useMutation({
    mutationFn: async (analysisId: number) => {
      const response = await fetch(`/api/analysis/${analysisId}/export/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${analysisId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "PDF Export",
        description: "Analysis exported successfully."
      });
    }
  });

  const exportImageMutation = useMutation({
    mutationFn: async (analysisId: number) => {
      const response = await fetch(`/api/analysis/${analysisId}/export/image`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${analysisId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Image Export",
        description: "Analysis image exported successfully."
      });
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawCanvas();
      }
    };

    const drawCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      drawGrid(ctx, canvas.width, canvas.height, canvasState);
      
      // Draw analysis results if available
      if (currentAnalysis) {
        drawAnalysisResults(ctx, currentAnalysis, canvasState);
      }
    };

    resizeCanvas();
    drawCanvas();

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [currentAnalysis, canvasState]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, state: CanvasState) => {
    const gridSize = 20 * state.zoom;
    ctx.strokeStyle = '#3A3A3A';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.5;

    for (let x = (state.panX % gridSize); x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = (state.panY % gridSize); y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const drawAnalysisResults = (ctx: CanvasRenderingContext2D, analysis: Analysis, state: CanvasState) => {
    const results = analysis.results ? JSON.parse(analysis.results) : null;
    if (!results) return;

    const { zones, ilots, corridors } = results;

    // Draw walls
    if (zones?.walls) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      zones.walls.forEach((wall: any) => {
        if (wall.coordinates && wall.coordinates.length >= 2) {
          ctx.beginPath();
          const startX = wall.coordinates[0][0] * state.zoom + state.panX;
          const startY = wall.coordinates[0][1] * state.zoom + state.panY;
          ctx.moveTo(startX, startY);
          
          for (let i = 1; i < wall.coordinates.length; i++) {
            const x = wall.coordinates[i][0] * state.zoom + state.panX;
            const y = wall.coordinates[i][1] * state.zoom + state.panY;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      });
    }

    // Draw corridors
    if (corridors) {
      ctx.fillStyle = '#FFA500';
      ctx.globalAlpha = 0.6;
      corridors.forEach((corridor: any) => {
        const x = corridor.x * state.zoom + state.panX;
        const y = corridor.y * state.zoom + state.panY;
        const width = corridor.width * state.zoom;
        const height = corridor.height * state.zoom;
        ctx.fillRect(x, y, width, height);
      });
      ctx.globalAlpha = 1;
    }

    // Draw îlots
    if (ilots) {
      ctx.fillStyle = '#7ED321';
      ctx.strokeStyle = '#5CB615';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      
      ilots.forEach((ilot: any) => {
        const x = ilot.x * state.zoom + state.panX;
        const y = ilot.y * state.zoom + state.panY;
        const width = ilot.width * state.zoom;
        const height = ilot.height * state.zoom;
        
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        
        // Draw îlot label
        ctx.fillStyle = '#000000';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${ilot.area}m²`,
          x + width / 2,
          y + height / 2
        );
        ctx.fillStyle = '#7ED321';
      });
      ctx.globalAlpha = 1;
    }
  };

  const handleZoomIn = () => {
    setCanvasState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
  };

  const handleZoomOut = () => {
    setCanvasState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  };

  const handleFitToScreen = () => {
    setCanvasState(prev => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
  };

  const handleToolSelect = (tool: string) => {
    setCanvasState(prev => ({ ...prev, selectedTool: tool }));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (canvasState.selectedTool === 'pan') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        
        const handleMouseMove = (e: MouseEvent) => {
          const deltaX = e.clientX - rect.left - startX;
          const deltaY = e.clientY - rect.top - startY;
          
          setCanvasState(prev => ({
            ...prev,
            panX: prev.panX + deltaX,
            panY: prev.panY + deltaY
          }));
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    }
  };

  return (
    <div className="visualization-area flex-1 flex flex-col relative">
      {/* Canvas Container */}
      <div className="flex-1 relative bg-dark-primary overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleCanvasMouseDown}
          style={{ 
            cursor: canvasState.selectedTool === 'pan' ? 'grab' : 'crosshair',
          }}
        />
        
        {/* No Floor Plan Message */}
        {!currentProject && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-medium text-text-primary mb-2">No Floor Plan Loaded</h3>
              <p className="text-text-secondary">Upload a DXF file to begin visualization and analysis</p>
            </div>
          </div>
        )}
        
        {/* Toolbar - Fixed position at top left */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center space-x-2 bg-dark-secondary bg-opacity-95 backdrop-blur-sm rounded-lg p-2 border border-dark-tertiary shadow-lg">
            <button
              onClick={() => handleToolSelect('select')}
              className={`p-2 rounded transition-colors ${canvasState.selectedTool === 'select' ? 'bg-accent-blue text-white' : 'bg-dark-tertiary hover:bg-gray-600 text-text-primary'}`}
              title="Select Tool"
            >
              <i className="fas fa-mouse-pointer text-sm"></i>
            </button>
            <button
              onClick={() => handleToolSelect('pan')}
              className={`p-2 rounded transition-colors ${canvasState.selectedTool === 'pan' ? 'bg-accent-blue text-white' : 'bg-dark-tertiary hover:bg-gray-600 text-text-primary'}`}
              title="Pan Tool"
            >
              <i className="fas fa-hand-paper text-sm"></i>
            </button>
            <button
              onClick={() => handleToolSelect('measure')}
              className={`p-2 rounded transition-colors ${canvasState.selectedTool === 'measure' ? 'bg-accent-blue text-white' : 'bg-dark-tertiary hover:bg-gray-600 text-text-primary'}`}
              title="Measure Tool"
            >
              <i className="fas fa-ruler text-sm"></i>
            </button>
            <button
              onClick={() => handleToolSelect('zoom')}
              className={`p-2 rounded transition-colors ${canvasState.selectedTool === 'zoom' ? 'bg-accent-blue text-white' : 'bg-dark-tertiary hover:bg-gray-600 text-text-primary'}`}
              title="Zoom Tool"
            >
              <i className="fas fa-search-plus text-sm"></i>
            </button>
          </div>
        </div>
        
        {/* Zoom Controls - Fixed position at top right */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center space-x-2 bg-dark-secondary bg-opacity-95 backdrop-blur-sm rounded-lg p-2 border border-dark-tertiary shadow-lg">
            <button
              onClick={handleFitToScreen}
              className="bg-dark-tertiary hover:bg-gray-600 text-text-primary px-3 py-1 rounded text-sm transition-colors"
              title="Fit to Screen"
            >
              Fit to Screen
            </button>
            <button
              onClick={handleZoomIn}
              className="bg-dark-tertiary hover:bg-gray-600 text-text-primary px-3 py-1 rounded text-sm transition-colors"
              title="Zoom In"
            >
              <i className="fas fa-search-plus mr-1"></i>
              Zoom In
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-dark-tertiary hover:bg-gray-600 text-text-primary px-3 py-1 rounded text-sm transition-colors"
              title="Zoom Out"
            >
              <i className="fas fa-search-minus mr-1"></i>
              Zoom Out
            </button>
          </div>
        </div>

        {/* Export Controls - Fixed position at bottom right */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="flex items-center space-x-2 bg-dark-secondary bg-opacity-95 backdrop-blur-sm rounded-lg p-2 border border-dark-tertiary shadow-lg">
            <button
              onClick={() => currentAnalysis && exportPdfMutation.mutate(currentAnalysis.id)}
              disabled={!currentAnalysis || exportPdfMutation.isPending}
              className="bg-accent-blue hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
              title="Export PDF"
            >
              <i className="fas fa-download mr-1"></i>
              Export PDF
            </button>
            <button
              onClick={() => currentAnalysis && exportImageMutation.mutate(currentAnalysis.id)}
              disabled={!currentAnalysis || exportImageMutation.isPending}
              className="bg-accent-orange hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
              title="Export Image"
            >
              <i className="fas fa-image mr-1"></i>
              Export Image
            </button>
          </div>
        </div>
        
        {/* Legend - Fixed position at bottom left */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-dark-secondary bg-opacity-95 backdrop-blur-sm rounded-lg p-3 border border-dark-tertiary shadow-lg w-48">
            <h4 className="text-text-primary font-semibold mb-2 text-sm">Legend</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-black flex-shrink-0"></div>
                <span className="text-text-primary text-xs">Walls</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent-blue rounded flex-shrink-0"></div>
                <span className="text-text-primary text-xs">Restricted Areas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-status-red rounded flex-shrink-0"></div>
                <span className="text-text-primary text-xs">Entrances/Exits</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-status-green rounded flex-shrink-0"></div>
                <span className="text-text-primary text-xs">Îlots</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent-orange rounded flex-shrink-0"></div>
                <span className="text-text-primary text-xs">Corridors</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}