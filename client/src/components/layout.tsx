import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(location === '/' ? 'analysis' : location.slice(1));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects']
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    console.log('Selected project:', project);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && sidebarOpen) {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburger-menu');
        if (sidebar && !sidebar.contains(event.target as Node) && 
            hamburger && !hamburger.contains(event.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  return (
    <div className="flex h-screen bg-dark-primary overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-dark-secondary border-b border-dark-tertiary p-3 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-accent-blue rounded-lg flex items-center justify-center">
                <i className="fas fa-cube text-white text-xs"></i>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-text-primary">Floor Plan Analyzer</h1>
              </div>
            </div>
            <button
              id="hamburger-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-dark-tertiary text-text-primary hover:bg-gray-600 transition-colors"
            >
              <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out' : 'relative'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'w-72' : 'w-60'}
        ${!isMobile ? 'flex-shrink-0' : ''}
        bg-dark-secondary
      `}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          projects={projects}
          currentProject={projects[0] || null}
          onProjectSelect={handleProjectSelect}
          isMobile={isMobile}
        />
      </div>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`
        flex-1 min-w-0 overflow-hidden
        ${isMobile ? 'pt-12' : ''}
      `}>
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}