import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import SimpleUpload from "@/components/simple-upload";
import VisualizationArea from "@/components/visualization-area";
import type { Project, Configuration, Analysis } from "@shared/schema";

interface AnalyzerState {
  currentProject: Project | null;
  currentAnalysis: Analysis | null;
  activeTab: string;
}

export default function Analyzer() {
  const [state, setState] = useState<AnalyzerState>({
    currentProject: null,
    currentAnalysis: null,
    activeTab: "analysis"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: true
  });

  const { data: configurations } = useQuery({
    queryKey: ['/api/projects', state.currentProject?.id, 'configurations'],
    enabled: !!state.currentProject?.id
  });

  const { data: analyses } = useQuery({
    queryKey: ['/api/projects', state.currentProject?.id, 'analyses'],
    enabled: !!state.currentProject?.id
  });

  const createProjectMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/projects', formData);
      return response.json();
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setState(prev => ({ ...prev, currentProject: project }));
      toast({
        title: "Project Created",
        description: "Your floor plan project has been created successfully."
      });
    },
    onError: (error: any) => {
      console.error("Project creation error:", error);
      let errorMessage = "Failed to create project. Please try again.";

      if (error?.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });



  const startAnalysisMutation = useMutation({
    mutationFn: async (analysisData: any) => {
      const response = await apiRequest('POST', `/api/projects/${analysisData.projectId}/analyses`, {
        status: "pending"
      });
      return response.json();
    },
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', state.currentProject?.id, 'analyses'] });
      setState(prev => ({ ...prev, currentAnalysis: analysis }));
      toast({
        title: "Analysis Started",
        description: "Floor plan analysis has begun. Results will appear shortly."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleProjectUpload = async (file: File, name: string, description: string) => {
    console.log("Creating project with:", { projectName: name, description, fileName: file.name });

    // Validate file before upload
    if (!file || file.size === 0) {
      toast({
        title: "Invalid File",
        description: "Please select a valid file.",
        variant: "destructive"
      });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.dxf') && !file.name.toLowerCase().endsWith('.dwg')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a DXF or DWG file.",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('dxfFile', file, file.name);
    formData.append('name', name.trim());
    formData.append('description', description.trim());

    // Verify FormData contents
    const uploadedFile = formData.get('dxfFile') as File;
    console.log("FormData validation:", {
      hasFile: !!uploadedFile,
      fileName: uploadedFile?.name,
      fileSize: uploadedFile?.size,
      name: formData.get('name'),
      description: formData.get('description')
    });

    createProjectMutation.mutate(formData);
  };

  const handleAnalysisStart = () => {
    if (!state.currentProject) return;
    
    // Start analysis directly with the project
    startAnalysisMutation.mutate({
      projectId: state.currentProject.id,
      status: "pending"
    });
  };

  const handleTabChange = (tab: string) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  return (
    <div className="flex flex-col h-full bg-dark-primary text-text-primary">
      {/* Top Bar */}
      <div className="bg-dark-secondary border-b border-dark-tertiary p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <i className="fas fa-wrench text-accent-blue"></i>
            <h2 className="text-lg lg:text-xl font-semibold text-text-primary">Floor Plan Analysis</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {state.currentProject && (
              <div className="flex items-center space-x-2 text-text-secondary text-sm">
                <i className="fas fa-check-circle text-accent-green"></i>
                <span>Project saved automatically</span>
              </div>
            )}
            <button 
              onClick={handleAnalysisStart}
              disabled={!state.currentProject || startAnalysisMutation.isPending}
              className="bg-status-green hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              {startAnalysisMutation.isPending ? 'Reanalysing...' : 'Reanalyze'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="w-full lg:w-1/3 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-dark-tertiary">
          <div className="w-full h-full bg-dark-secondary p-4 lg:p-6 overflow-y-auto scrollbar-hide min-h-0">
            <SimpleUpload
              onFileUpload={handleProjectUpload}
              isUploading={createProjectMutation.isPending}
            />
            
            {/* Current Project Info */}
            {state.currentProject && (
              <div className="mt-6 p-4 bg-dark-tertiary rounded-lg">
                <h4 className="text-text-primary font-medium mb-2">Current Project</h4>
                <p className="text-text-secondary text-sm">{state.currentProject.name}</p>
                {analyses && analyses.length > 0 && (
                  <div className="mt-2">
                    <span className="text-accent-green text-xs">✓ Analysis complete</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 min-h-0">
          <VisualizationArea
            currentProject={state.currentProject}
            currentAnalysis={state.currentAnalysis}
            analyses={analyses || []}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-dark-secondary border-t border-dark-tertiary px-4 py-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-status-green rounded-full"></div>
              <span className="text-text-secondary text-xs lg:text-sm">Database Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-status-yellow rounded-full"></div>
              <span className="text-text-secondary text-xs lg:text-sm">Analysis Ready</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-text-secondary text-xs lg:text-sm">
              Total Îlots: <span className="text-text-primary font-medium">{state.currentAnalysis?.totalIlots || 0}</span>
            </span>
            <span className="text-text-secondary text-xs lg:text-sm">
              Coverage: <span className="text-text-primary font-medium">{((state.currentAnalysis?.coverage || 0) * 100).toFixed(1)}%</span>
            </span>
            <span className="text-text-secondary text-xs lg:text-sm">
              Version: <span className="text-text-primary font-medium">Pro 2.1.0</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}