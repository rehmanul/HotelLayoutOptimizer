import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  BarChart3, 
  Eye, 
  Bot, 
  TrendingUp, 
  Users, 
  FileText, 
  Settings, 
  Shield,
  LogOut
} from "lucide-react";
import { Link, useLocation } from "wouter";

const navigation = [
  { name: "Analysis", href: "/analyzer", icon: LayoutDashboard },
  { name: "Results", href: "/results", icon: BarChart3 },
  { name: "Visualization", href: "/visualization", icon: Eye },
  { name: "AI Optimization", href: "/ai-optimization", icon: Bot },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Collaboration", href: "/collaboration", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
];

const adminNavigation = [
  { name: "Admin", href: "/admin", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-dark-secondary border-r border-border">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">Professional Floor Plan</span>
            <span className="text-xs text-text-secondary">Analyzer</span>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* User Info */}
      <div className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              A
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              Welcome, admin
            </p>
            <p className="text-xs text-text-secondary truncate">
              (admin)
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start space-x-3 h-10 px-3",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-text-secondary hover:text-text-primary hover:bg-dark-tertiary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4 bg-border" />

        {/* Admin Section */}
        <div className="space-y-2">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Admin
            </h3>
          </div>
          {adminNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start space-x-3 h-10 px-3",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-text-secondary hover:text-text-primary hover:bg-dark-tertiary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <Separator className="my-4 bg-border" />

        {/* Logout */}
        <div className="px-3">
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 h-10 px-3 text-text-secondary hover:text-text-primary hover:bg-dark-tertiary"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </Button>
        </div>
      </ScrollArea>

      {/* Status */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-text-secondary">Database Connected</span>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-text-secondary">Analysis Ready</span>
        </div>
      </div>
    </div>
  );
}
