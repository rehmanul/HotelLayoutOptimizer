import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface SimpleUploadProps {
  onFileUpload: (file: File, name: string, description: string) => void;
  isUploading: boolean;
}

export default function SimpleUpload({ onFileUpload, isUploading }: SimpleUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    // Auto-generate project name from filename
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const autoName = fileName || `Floor Plan ${new Date().toLocaleString()}`;
    
    onFileUpload(file, autoName, "Auto-uploaded floor plan");
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.dxf') || ext.endsWith('.dwg') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
    });
    
    if (validFile && validFile.size > 0) {
      console.log('Dropped file:', {
        name: validFile.name,
        size: validFile.size,
        type: validFile.type,
        lastModified: validFile.lastModified
      });
      
      handleFileUpload(validFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a valid DXF, DWG, PNG, JPG, or JPEG file.",
        variant: "destructive"
      });
    }
  }, [handleFileUpload, toast]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 0) {
      console.log('Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      handleFileUpload(file);
      
      // Reset the input
      e.target.value = '';
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Floor Plan Upload</h3>
      
      <div 
        className={`upload-zone rounded-lg p-8 text-center transition-all duration-300 ${
          dragOver 
            ? 'border-accent-blue bg-accent-blue bg-opacity-10 cursor-pointer' 
            : 'border-2 border-dashed border-dark-tertiary hover:border-accent-blue hover:bg-accent-blue hover:bg-opacity-5 cursor-pointer'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <i className="fas fa-cloud-upload-alt text-4xl text-text-secondary mb-4"></i>
        <p className="text-text-primary font-medium mb-2">
          {isUploading ? 'Uploading and analyzing...' : 'Drop floor plan here or click to browse'}
        </p>
        <p className="text-text-secondary text-sm">Supported: DXF, DWG, PNG, JPG, JPEG</p>
        <p className="text-accent-blue text-xs mt-2">Analysis starts automatically after upload</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".dxf,.dwg,.png,.jpg,.jpeg"
          onChange={handleFileInputChange}
        />
      </div>
    </div>
  );
}