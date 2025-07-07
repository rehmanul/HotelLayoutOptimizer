import { useState } from "react";
import Sidebar from "./sidebar";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(location === '/' ? 'analysis' : location.slice(1));
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects']
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleProjectSelect = (project: Project) => {
    console.log('Selected project:', project);
  };

  return (
    <div className="flex h-screen bg-dark-primary">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        projects={projects}
        currentProject={projects[0] || null}
        onProjectSelect={handleProjectSelect}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}