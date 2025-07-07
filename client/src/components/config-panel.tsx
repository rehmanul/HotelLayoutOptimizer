import { useState, useRef, useCallback } from "react";
import type { Project, Configuration } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ConfigPanelProps {
  currentProject: Project | null;
  currentConfiguration: Configuration | null;
  onProjectUpload: (file: File, name: string, description: string) => void;
  onConfigurationChange: (config: any) => void;
  isUploading: boolean;
}

interface IlotDistribution {
  size0to1: number;
  size1to3: number;
  size3to5: number;
  size5to10: number;
}

export default function ConfigPanel({
  currentProject,
  currentConfiguration,
  onProjectUpload,
  onConfigurationChange,
  isUploading
}: ConfigPanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  
  const [ilotDistribution, setIlotDistribution] = useState<IlotDistribution>({
    size0to1: 10,
    size1to3: 25,
    size3to5: 30,
    size5to10: 35
  });
  
  const [corridorSettings, setCorridorSettings] = useState({
    width: 1.5,
    minClearance: 0.5,
    autoGenerate: true
  });
  
  const [advancedOptions, setAdvancedOptions] = useState({
    spaceOptimization: true,
    avoidOverlaps: true,
    respectConstraints: true
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const dxfFile = files.find(file => file.name.toLowerCase().endsWith('.dxf') || file.name.toLowerCase().endsWith('.dwg'));
    
    if (dxfFile) {
      console.log('Dropped file:', dxfFile);
      console.log('File size:', dxfFile.size);
      console.log('File type:', dxfFile.type);
      handleFileUpload(dxfFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a DXF or DWG file.",
        variant: "destructive"
      });
    }
  }, [handleFileUpload, toast]);

  const handleFileUpload = useCallback((file: File) => {
    if (!projectName.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a project name before uploading.",
        variant: "destructive"
      });
      return;
    }
    
    onProjectUpload(file, projectName, projectDescription);
    setProjectName("");
    setProjectDescription("");
  }, [projectName, projectDescription, onProjectUpload, toast]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleIlotDistributionChange = (key: keyof IlotDistribution, value: number) => {
    const newDistribution = { ...ilotDistribution, [key]: value };
    setIlotDistribution(newDistribution);
    
    // Auto-save configuration
    onConfigurationChange({
      ilotDistribution: newDistribution,
      corridorWidth: corridorSettings.width,
      minClearance: corridorSettings.minClearance,
      autoGenerateCorridors: corridorSettings.autoGenerate,
      ...advancedOptions
    });
  };

  const handleCorridorSettingsChange = (key: string, value: any) => {
    const newSettings = { ...corridorSettings, [key]: value };
    setCorridorSettings(newSettings);
    
    // Auto-save configuration
    onConfigurationChange({
      ilotDistribution,
      corridorWidth: newSettings.width,
      minClearance: newSettings.minClearance,
      autoGenerateCorridors: newSettings.autoGenerate,
      ...advancedOptions
    });
  };

  const handleAdvancedOptionsChange = (key: string, value: boolean) => {
    const newOptions = { ...advancedOptions, [key]: value };
    setAdvancedOptions(newOptions);
    
    // Auto-save configuration
    onConfigurationChange({
      ilotDistribution,
      corridorWidth: corridorSettings.width,
      minClearance: corridorSettings.minClearance,
      autoGenerateCorridors: corridorSettings.autoGenerate,
      ...newOptions
    });
  };

  return (
    <div className="w-80 bg-dark-secondary border-r border-dark-tertiary p-6 overflow-y-auto scrollbar-hide">
      {/* File Upload Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Floor Plan Upload</h3>
        
        {/* Project Name Input */}
        <div className="mb-4">
          <label className="text-text-primary text-sm font-medium mb-2 block">
            Project Name <span className="text-accent-orange">*</span>
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name (required)"
            className={`w-full bg-dark-tertiary text-text-primary rounded-lg px-3 py-2 border focus:outline-none transition-colors ${
              projectName.trim() ? 'border-dark-tertiary focus:border-accent-blue' : 'border-accent-orange focus:border-accent-orange'
            }`}
            required
          />
          {!projectName.trim() && (
            <p className="text-accent-orange text-xs mt-1">Project name is required</p>
          )}
        </div>
        
        {/* Project Description Input */}
        <div className="mb-4">
          <label className="text-text-primary text-sm font-medium mb-2 block">Description (Optional)</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Enter project description"
            rows={3}
            className="w-full bg-dark-tertiary text-text-primary rounded-lg px-3 py-2 border border-dark-tertiary focus:border-accent-blue focus:outline-none resize-none"
          />
        </div>
        
        <div 
          className={`upload-zone rounded-lg p-8 text-center transition-all duration-300 ${
            !projectName.trim() 
              ? 'border-2 border-dashed border-gray-600 bg-gray-800 bg-opacity-50 cursor-not-allowed' 
              : dragOver 
                ? 'border-accent-blue bg-accent-blue bg-opacity-10 cursor-pointer' 
                : 'border-2 border-dashed border-dark-tertiary hover:border-accent-blue hover:bg-accent-blue hover:bg-opacity-5 cursor-pointer'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (projectName.trim()) setDragOver(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (projectName.trim()) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={projectName.trim() ? handleDrop : (e) => {
            e.preventDefault();
            e.stopPropagation();
            toast({
              title: "Project Name Required",
              description: "Please enter a project name before uploading.",
              variant: "destructive"
            });
          }}
          onClick={() => {
            if (projectName.trim()) {
              fileInputRef.current?.click();
            } else {
              toast({
                title: "Project Name Required",
                description: "Please enter a project name before uploading.",
                variant: "destructive"
              });
            }
          }}
        >
          <i className="fas fa-cloud-upload-alt text-4xl text-text-secondary mb-4"></i>
          <p className="text-text-primary font-medium mb-2">
            {isUploading ? 'Uploading...' : 'Drop DXF file here or click to browse'}
          </p>
          <p className="text-text-secondary text-sm">Supported formats: DXF, DWG</p>
          {!projectName.trim() && (
            <p className="text-accent-orange text-xs mt-2">⚠️ Please enter a project name first</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".dxf,.dwg"
            onChange={handleFileInputChange}
            disabled={isUploading}
          />
        </div>
      </div>
      
      {/* Warning Alert */}
      {!currentProject && (
        <div className="bg-status-yellow bg-opacity-20 border border-status-yellow rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <i className="fas fa-exclamation-triangle text-status-yellow"></i>
            <div>
              <p className="text-text-primary font-medium">No Floor Plan Uploaded</p>
              <p className="text-text-secondary text-sm">Please upload a DXF file first to begin analysis.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Îlot Configuration */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Îlot Distribution</h3>
        <div className="space-y-4">
          {Object.entries(ilotDistribution).map(([key, value]) => {
            const labels = {
              size0to1: '0-1 m²',
              size1to3: '1-3 m²',
              size3to5: '3-5 m²',
              size5to10: '5-10 m²'
            };
            
            return (
              <div key={key} className="bg-dark-tertiary rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-primary text-sm">{labels[key as keyof typeof labels]}</span>
                  <span className="text-accent-blue text-sm font-medium">{value}%</span>
                </div>
                <div className="w-full bg-dark-primary rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-accent-blue to-status-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => handleIlotDistributionChange(key as keyof IlotDistribution, parseInt(e.target.value))}
                  className="w-full mt-2 accent-accent-blue"
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Corridor Configuration */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Corridor Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-text-primary text-sm font-medium mb-2 block">Corridor Width (m)</label>
            <input
              type="number"
              value={corridorSettings.width}
              onChange={(e) => handleCorridorSettingsChange('width', parseFloat(e.target.value))}
              min="0.5"
              max="5"
              step="0.1"
              className="w-full bg-dark-tertiary text-text-primary rounded-lg px-3 py-2 border border-dark-tertiary focus:border-accent-blue focus:outline-none"
            />
          </div>
          
          <div>
            <label className="text-text-primary text-sm font-medium mb-2 block">Minimum Clearance (m)</label>
            <input
              type="number"
              value={corridorSettings.minClearance}
              onChange={(e) => handleCorridorSettingsChange('minClearance', parseFloat(e.target.value))}
              min="0.1"
              max="2"
              step="0.1"
              className="w-full bg-dark-tertiary text-text-primary rounded-lg px-3 py-2 border border-dark-tertiary focus:border-accent-blue focus:outline-none"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="auto-corridor"
              checked={corridorSettings.autoGenerate}
              onChange={(e) => handleCorridorSettingsChange('autoGenerate', e.target.checked)}
              className="w-4 h-4 text-accent-blue bg-dark-tertiary rounded border-dark-tertiary focus:ring-accent-blue"
            />
            <label htmlFor="auto-corridor" className="text-text-primary text-sm">Auto-generate corridors</label>
          </div>
        </div>
      </div>
      
      {/* Zone Detection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Zone Detection</h3>
        <div className="space-y-3">
          <div className="border-l-4 border-black pl-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-text-primary text-sm">Walls</span>
              <span className="text-status-green text-xs">
                {currentProject ? 'Detected' : 'Pending'}
              </span>
            </div>
          </div>
          <div className="border-l-4 border-accent-blue pl-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-text-primary text-sm">Restricted Areas</span>
              <span className="text-text-secondary text-xs">
                {currentProject ? 'Detected' : 'Pending'}
              </span>
            </div>
          </div>
          <div className="border-l-4 border-status-red pl-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-text-primary text-sm">Entrances/Exits</span>
              <span className="text-text-secondary text-xs">
                {currentProject ? 'Detected' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced Options */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Advanced Options</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="optimize-space"
              checked={advancedOptions.spaceOptimization}
              onChange={(e) => handleAdvancedOptionsChange('spaceOptimization', e.target.checked)}
              className="w-4 h-4 text-accent-blue bg-dark-tertiary rounded border-dark-tertiary focus:ring-accent-blue"
            />
            <label htmlFor="optimize-space" className="text-text-primary text-sm">Space optimization</label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="avoid-overlap"
              checked={advancedOptions.avoidOverlaps}
              onChange={(e) => handleAdvancedOptionsChange('avoidOverlaps', e.target.checked)}
              className="w-4 h-4 text-accent-blue bg-dark-tertiary rounded border-dark-tertiary focus:ring-accent-blue"
            />
            <label htmlFor="avoid-overlap" className="text-text-primary text-sm">Avoid overlaps</label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="respect-constraints"
              checked={advancedOptions.respectConstraints}
              onChange={(e) => handleAdvancedOptionsChange('respectConstraints', e.target.checked)}
              className="w-4 h-4 text-accent-blue bg-dark-tertiary rounded border-dark-tertiary focus:ring-accent-blue"
            />
            <label htmlFor="respect-constraints" className="text-text-primary text-sm">Respect constraints</label>
          </div>
        </div>
      </div>
    </div>
  );
}
