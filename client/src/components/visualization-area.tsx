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
        description: "PDF exported successfully!"
      });
    }
  });

  const exportImageMutation = useMutation({
    mutationFn: async (analysisId: number) => {
      const response = await fetch(`/api/analysis/${analysisId}/export/png`);
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
        description: "Image exported successfully!"
      });
    }
  });

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    drawGrid(ctx, canvas.width, canvas.height, canvasState);

    if (currentAnalysis?.zonesDetected) {
      drawAnalysisResults(ctx, currentAnalysis, canvasState);
    }
  }, [currentAnalysis, canvasState]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, state: CanvasState) => {
    const gridSize = 20 * state.zoom;
    
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = state.panX % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = state.panY % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawAnalysisResults = (ctx: CanvasRenderingContext2D, analysis: Analysis, state: CanvasState) => {
    const zones = analysis.zonesDetected as any;
    const ilots = analysis.ilotsPlaced as any[];
    const corridors = analysis.corridorsGenerated as any[];

    // Draw walls
    if (zones?.walls) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      zones.walls.forEach((wall: any) => {
        if (wall.coordinates) {
          ctx.beginPath();
          wall.coordinates.forEach((coord: number[], index: number) => {
            const x = coord[0] * state.zoom + state.panX;
            const y = coord[1] * state.zoom + state.panY;
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        }
      });
    }

    // Draw restricted areas
    if (zones?.restricted) {
      ctx.fillStyle = '#4A90E2';
      ctx.globalAlpha = 0.3;
      zones.restricted.forEach((area: any) => {
        if (area.coordinates) {
          ctx.beginPath();
          area.coordinates.forEach((coord: number[], index: number) => {
            const x = coord[0] * state.zoom + state.panX;
            const y = coord[1] * state.zoom + state.panY;
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.closePath();
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    }

    // Draw entrances
    if (zones?.entrances) {
      ctx.strokeStyle = '#D0021B';
      ctx.lineWidth = 5;
      zones.entrances.forEach((entrance: any) => {
        if (entrance.coordinates) {
          ctx.beginPath();
          entrance.coordinates.forEach((coord: number[], index: number) => {
            const x = coord[0] * state.zoom + state.panX;
            const y = coord[1] * state.zoom + state.panY;
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        }
      });
    }

    // Draw corridors
    if (corridors) {
      ctx.fillStyle = '#F5A623';
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
    <div className="flex-1 flex flex-col">
      {/* Visualization Header */}
      <div className="bg-dark-secondary border-b border-dark-tertiary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-text-primary">2D Visualization</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFitToScreen}
                className="bg-dark-tertiary hover:bg-gray-600 text-text-primary px-3 py-1 rounded text-sm transition-colors"
              >
                <i className="fas fa-expand mr-1"></i>
                Fit to Screen
              </button>
              <button
                onClick={handleZoomIn}
                className="bg-dark-tertiary hover:bg-gray-600 text-text-primary px-3 py-1 rounded text-sm transition-colors"
              >
                <i className="fas fa-search-plus mr-1"></i>
                Zoom In
              </button>
              <button
                onClick={handleZoomOut}
                className="bg-dark-tertiary hover:bg-gray-600 text-text-primary px-3 py-1 rounded text-sm transition-colors"
              >
                <i className="fas fa-search-minus mr-1"></i>
                Zoom Out
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => currentAnalysis && exportPdfMutation.mutate(currentAnalysis.id)}
              disabled={!currentAnalysis || exportPdfMutation.isPending}
              className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-download mr-2"></i>
              Export PDF
            </button>
            <button
              onClick={() => currentAnalysis && exportImageMutation.mutate(currentAnalysis.id)}
              disabled={!currentAnalysis || exportImageMutation.isPending}
              className="bg-accent-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-image mr-2"></i>
              Export Image
            </button>
          </div>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div className="flex-1 relative bg-dark-primary">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          style={{ 
            cursor: canvasState.selectedTool === 'pan' ? 'grab' : 'crosshair',
            background: 'linear-gradient(45deg, #2A2A2A 25%, transparent 25%), linear-gradient(-45deg, #2A2A2A 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2A2A2A 75%), linear-gradient(-45deg, transparent 75%, #2A2A2A 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        />
        
        {/* Empty State */}
        {!currentProject && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-file-upload text-6xl text-text-secondary mb-4"></i>
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Floor Plan Loaded</h3>
              <p className="text-text-secondary">Upload a DXF file to begin visualization and analysis</p>
            </div>
          </div>
        )}
        
        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 bg-dark-secondary bg-opacity-95 backdrop-blur-sm rounded-lg p-4 w-64 border border-dark-tertiary">
          <h4 className="text-text-primary font-semibold mb-3">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-1 bg-black"></div>
              <span className="text-text-primary text-sm">Walls</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-accent-blue rounded"></div>
              <span className="text-text-primary text-sm">Restricted Areas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-status-red rounded"></div>
              <span className="text-text-primary text-sm">Entrances/Exits</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-status-green rounded"></div>
              <span className="text-text-primary text-sm">Îlots</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-accent-orange rounded"></div>
              <span className="text-text-primary text-sm">Corridors</span>
            </div>
          </div>
        </div>
        
        {/* Toolbar Overlay */}
        <div className="absolute bottom-4 left-4 bg-dark-secondary bg-opacity-95 backdrop-blur-sm rounded-lg p-4 border border-dark-tertiary">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleToolSelect('select')}
              className={`p-2 rounded transition-colors ${
                canvasState.selectedTool === 'select' 
                  ? 'bg-accent-blue text-white' 
                  : 'bg-dark-tertiary hover:bg-gray-600 text-text-primary'
              }`}
              title="Select Tool"
            >
              <i className="fas fa-mouse-pointer"></i>
            </button>
            <button
              onClick={() => handleToolSelect('pan')}
              className={`p-2 rounded transition-colors ${
                canvasState.selectedTool === 'pan' 
                  ? 'bg-accent-blue text-white' 
                  : 'bg-dark-tertiary hover:bg-gray-600 text-text-primary'
              }`}
              title="Pan Tool"
            >
              <i className="fas fa-hand-paper"></i>
            </button>
            <button
              onClick={() => handleToolSelect('measure')}
              className={`p-2 rounded transition-colors ${
                canvasState.selectedTool === 'measure' 
                  ? 'bg-accent-blue text-white' 
                  : 'bg-dark-tertiary hover:bg-gray-600 text-text-primary'
              }`}
              title="Measure Tool"
            >
              <i className="fas fa-ruler"></i>
            </button>
            <div className="border-l border-dark-tertiary mx-2 h-8"></div>
            <button
              className="bg-accent-blue hover:bg-blue-600 text-white p-2 rounded transition-colors"
              title="Add Îlot"
            >
              <i className="fas fa-plus"></i>
            </button>
            <button
              className="bg-accent-orange hover:bg-orange-600 text-white p-2 rounded transition-colors"
              title="Add Corridor"
            >
              <i className="fas fa-road"></i>
            </button>
          </div>
        </div>
        
        {/* Analysis Status */}
        {currentAnalysis && (
          <div className="absolute top-4 left-4 bg-dark-secondary bg-opacity-95 backdrop-blur-sm rounded-lg p-4 border border-dark-tertiary">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                currentAnalysis.status === 'completed' ? 'bg-status-green' :
                currentAnalysis.status === 'running' ? 'bg-status-yellow' :
                currentAnalysis.status === 'failed' ? 'bg-status-red' :
                'bg-text-secondary'
              }`}></div>
              <span className="text-text-primary font-medium">
                Analysis {currentAnalysis.status === 'completed' ? 'Complete' : 
                        currentAnalysis.status === 'running' ? 'Running' :
                        currentAnalysis.status === 'failed' ? 'Failed' : 'Pending'}
              </span>
            </div>
            {currentAnalysis.status === 'completed' && (
              <div className="mt-2 text-text-secondary text-sm">
                {currentAnalysis.totalIlots} îlots • {((currentAnalysis.coverage || 0) * 100).toFixed(1)}% coverage
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
