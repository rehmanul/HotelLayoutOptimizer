The code is modified to include clickable links for navigation items, admin section, and logout functionality.
```

```replit_final_file
import { useState } from 'react';
import { Link, useLocation } from "wouter";
import type { Project } from "@shared/schema";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  projects: Project[];
  currentProject: Project | null;
  onProjectSelect: (project: Project) => void;
  isMobile?: boolean;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  projects, 
  currentProject, 
  onProjectSelect,
  isMobile = false
}: SidebarProps) {
  const [showProjects, setShowProjects] = useState(false);

  const [location] = useLocation();

  const navItems = [
    { id: 'analysis', icon: 'fas fa-chart-line', label: 'Analysis', color: 'text-accent-blue', path: '/' },
    { id: 'results', icon: 'fas fa-chart-bar', label: 'Results', color: 'text-text-secondary', path: '/results' },
    { id: 'visualization', icon: 'fas fa-eye', label: 'Visualization', color: 'text-text-secondary', path: '/visualization' },
    { id: 'ai-optimization', icon: 'fas fa-cog', label: 'AI Optimization', color: 'text-text-secondary', path: '/ai-optimization' },
    { id: 'analytics', icon: 'fas fa-analytics', label: 'Analytics', color: 'text-text-secondary', path: '/analytics' },
    { id: 'collaboration', icon: 'fas fa-users', label: 'Collaboration', color: 'text-text-secondary', path: '/collaboration' },
    { id: 'reports', icon: 'fas fa-file-alt', label: 'Reports', color: 'text-text-secondary', path: '/reports' },
  ];

  const adminItems = [
    { id: 'admin', icon: 'fas fa-shield-alt', label: 'Admin', color: 'text-text-secondary', path: '/admin' },
    { id: 'settings', icon: 'fas fa-wrench', label: 'Settings', color: 'text-text-secondary', path: '/settings' },
  ];

  return (
    <div id="sidebar" className="w-full h-full bg-dark-secondary border-r border-dark-tertiary flex flex-col">
      {/* Header - Hidden on mobile since it's in the top bar */}
      {!isMobile && (
        <div className="p-4 border-b border-dark-tertiary">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
              <i className="fas fa-cube text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Professional Floor Plan</h1>
              <p className="text-xs text-text-secondary">Analyzer</p>
            </div>
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="p-4 border-b border-dark-tertiary">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center">
            <i className="fas fa-user text-white text-sm"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Welcome, admin</p>
            <p className="text-xs text-text-secondary">(admin)</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.id} href={item.path}>
            <div
              className={`flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                activeTab === item.id ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-dark-tertiary hover:text-text-primary'
              }`}
              onClick={() => {
                onTabChange(item.id);
              }}
            >
              <i className={`${item.icon} w-5 text-center`}></i>
              <span className="text-sm">{item.label}</span>
            </div>
          </Link>
        ))}

        <div className="mt-8 pt-4 border-t border-dark-tertiary">
          <p className="text-xs text-text-secondary font-medium mb-2 px-3">Admin</p>
          {/* Admin Section */}
      <div className="mt-4 pt-4 border-t border-dark-tertiary">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3 px-2">Admin</h3>
        <div className="space-y-2">
          <Link href="/admin">
            <div className={`flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
              activeTab === 'admin' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-dark-tertiary hover:text-text-primary'
            }`}>
              <i className="fas fa-shield-alt w-5 text-center"></i>
              <span className="text-sm">Admin</span>
            </div>
          </Link>
          <Link href="/settings">
            <div className={`flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
              activeTab === 'settings' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-dark-tertiary hover:text-text-primary'
            }`}>
              <i className="fas fa-cog w-5 text-center"></i>
              <span className="text-sm">Settings</span>
            </div>
          </Link>
          <div className="flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300 mt-2">
            <i className="fas fa-sign-out-alt w-5 text-center"></i>
            <span className="text-sm">Logout</span>
          </div>
        </div>
      </div>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-dark-tertiary space-y-2">
        <button 
          onClick={() => setShowProjects(!showProjects)}
          className="w-full bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between"
        >
          <span>
            <i className="fas fa-folder-open mr-2"></i>
            Projects
          </span>
          <i className={`fas fa-chevron-${showProjects ? 'up' : 'down'}`}></i>
        </button>

        {showProjects && (
          <div className="max-h-40 overflow-y-auto bg-dark-tertiary rounded-lg p-2">
            {projects.length === 0 ? (
              <p className="text-text-secondary text-xs p-2">No projects found</p>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-2 rounded cursor-pointer text-xs transition-colors ${
                    currentProject?.id === project.id 
                      ? 'bg-accent-blue text-white' 
                      : 'hover:bg-gray-600 text-text-secondary'
                  }`}
                  onClick={() => onProjectSelect(project)}
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-xs opacity-75">{project.description}</div>
                </div>
              ))
            )}
          </div>
        )}

        <button className="w-full bg-accent-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </button>
      </div>
    </div>
  );
}