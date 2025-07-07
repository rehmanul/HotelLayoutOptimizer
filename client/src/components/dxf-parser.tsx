import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DxfParserProps {
  onParsed: (data: any) => void;
}

export default function DxfParser({ onParsed }: DxfParserProps) {
  const { toast } = useToast();
  
  const parseDxfMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('dxfFile', file);
      const response = await apiRequest('POST', '/api/dxf/parse', formData);
      return response.json();
    },
    onSuccess: (data) => {
      onParsed(data);
      toast({
        title: "DXF Parsed Successfully",
        description: "Floor plan has been analyzed and zones detected."
      });
    },
    onError: () => {
      toast({
        title: "Parse Error",
        description: "Failed to parse DXF file. Please check the file format.",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (file: File) => {
    if (file.name.endsWith('.dxf') || file.name.endsWith('.dwg')) {
      parseDxfMutation.mutate(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a DXF or DWG file.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="dxf-parser">
      <input
        type="file"
        accept=".dxf,.dwg"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        }}
        className="hidden"
        id="dxf-upload"
      />
      <label
        htmlFor="dxf-upload"
        className="inline-block bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
      >
        {parseDxfMutation.isPending ? 'Parsing...' : 'Upload DXF File'}
      </label>
    </div>
  );
}
