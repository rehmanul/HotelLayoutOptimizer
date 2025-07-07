import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import ConfigPanel from "@/components/config-panel";
import VisualizationArea from "@/components/visualization-area";
import type { Project, Configuration, Analysis } from "@shared/schema";

interface AnalyzerState {
  currentProject: Project | null;
  currentConfiguration: Configuration | null;
  currentAnalysis: Analysis | null;
  activeTab: string;
}

export default function Analyzer() {
  const [state, setState] = useState<AnalyzerState>({
    currentProject: null,
    currentConfiguration: null,
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

  const createConfigurationMutation = useMutation({
    mutationFn: async (configData: any) => {
      const response = await apiRequest('POST', `/api/projects/${state.currentProject?.id}/configurations`, configData);
      return response.json();
    },
    onSuccess: (configuration) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', state.currentProject?.id, 'configurations'] });
      setState(prev => ({ ...prev, currentConfiguration: configuration }));
      toast({
        title: "Configuration Saved",
        description: "Your analysis configuration has been saved."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    }
  });

  const startAnalysisMutation = useMutation({
    mutationFn: async (analysisData: any) => {
      const response = await apiRequest('POST', `/api/projects/${state.currentProject?.id}/analyses`, analysisData);
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

  const handleConfigurationSave = (configData: any) => {
    if (!state.currentProject) return;
    createConfigurationMutation.mutate({
      ...configData,
      name: `Configuration ${Date.now()}`
    });
  };

  const handleAnalysisStart = () => {
    if (!state.currentProject || !state.currentConfiguration) return;
    startAnalysisMutation.mutate({
      configurationId: state.currentConfiguration.id,
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-wrench text-accent-blue"></i>
            <h2 className="text-xl font-semibold text-text-primary">Advanced Analysis Configuration</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleConfigurationSave(state.currentConfiguration)}
              disabled={!state.currentProject}
              className="bg-dark-tertiary hover:bg-gray-600 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-save mr-2"></i>
              Save Project
            </button>
            <button 
              onClick={handleAnalysisStart}
              disabled={!state.currentProject || !state.currentConfiguration || startAnalysisMutation.isPending}
              className="bg-status-green hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-play mr-2"></i>
              {startAnalysisMutation.isPending ? 'Starting...' : 'Start Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex">
        <ConfigPanel
          currentProject={state.currentProject}
          currentConfiguration={state.currentConfiguration}
          onProjectUpload={handleProjectUpload}
          onConfigurationChange={handleConfigurationSave}
          isUploading={createProjectMutation.isPending}
        />

        <VisualizationArea
          currentProject={state.currentProject}
          currentAnalysis={state.currentAnalysis}
          analyses={analyses || []}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-dark-secondary border-t border-dark-tertiary px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-status-green rounded-full"></div>
              <span className="text-text-secondary text-sm">Database Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-status-yellow rounded-full"></div>
              <span className="text-text-secondary text-sm">Analysis Ready</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-text-secondary text-sm">
              Total Îlots: <span className="text-text-primary font-medium">{state.currentAnalysis?.totalIlots || 0}</span>
            </span>
            <span className="text-text-secondary text-sm">
              Coverage: <span className="text-text-primary font-medium">{((state.currentAnalysis?.coverage || 0) * 100).toFixed(1)}%</span>
            </span>
            <span className="text-text-secondary text-sm">
              Version: <span className="text-text-primary font-medium">Pro 2.1.0</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}