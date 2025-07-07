import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, Users, Settings, Database, Activity, 
  Lock, Key, AlertTriangle, CheckCircle, XCircle 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Admin() {
  const systemHealth = {
    database: { status: 'healthy', usage: 45 },
    storage: { status: 'healthy', usage: 62 },
    api: { status: 'healthy', responseTime: '120ms' },
    workers: { status: 'warning', active: 3, total: 5 }
  };

  const securitySettings = {
    twoFactorAuth: true,
    sessionTimeout: 30,
    ipWhitelisting: false,
    auditLogging: true,
    encryptionAtRest: true
  };

  const userStats = {
    totalUsers: 48,
    activeToday: 12,
    newThisWeek: 3,
    adminUsers: 4
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Shield className="h-10 w-10 text-accent-blue" />
          Admin Panel
        </h1>
        <p className="text-text-secondary">System administration and security management</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-dark-tertiary">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{userStats.totalUsers}</div>
                <p className="text-xs text-accent-green mt-1">+3 this week</p>
              </CardContent>
            </Card>

            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">Active Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{userStats.activeToday}</div>
                <p className="text-xs text-text-secondary mt-1">25% of total</p>
              </CardContent>
            </Card>

            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Operational
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">API Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{systemHealth.api.responseTime}</div>
                <p className="text-xs text-text-secondary mt-1">Avg response time</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-text-secondary">Database Usage</span>
                  <span className="text-sm font-medium text-text-primary">{systemHealth.database.usage}%</span>
                </div>
                <Progress value={systemHealth.database.usage} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-text-secondary">Storage Usage</span>
                  <span className="text-sm font-medium text-text-primary">{systemHealth.storage.usage}%</span>
                </div>
                <Progress value={systemHealth.storage.usage} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-text-secondary">Worker Processes</span>
                  <span className="text-sm font-medium text-text-primary">
                    {systemHealth.workers.active}/{systemHealth.workers.total}
                  </span>
                </div>
                <Progress 
                  value={(systemHealth.workers.active / systemHealth.workers.total) * 100} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-dark-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-accent-blue" />
                    <div>
                      <p className="font-medium text-text-primary">Bulk User Import</p>
                      <p className="text-sm text-text-secondary">Import users from CSV</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Import</Button>
                </div>

                <div className="flex justify-between items-center p-4 bg-dark-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-accent-orange" />
                    <div>
                      <p className="font-medium text-text-primary">Reset All Passwords</p>
                      <p className="text-sm text-text-secondary">Force password reset for all users</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-orange-500 border-orange-500">
                    Reset
                  </Button>
                </div>

                <div className="flex justify-between items-center p-4 bg-dark-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-accent-green" />
                    <div>
                      <p className="font-medium text-text-primary">Access Control</p>
                      <p className="text-sm text-text-secondary">Manage role-based permissions</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Security Settings</CardTitle>
              <CardDescription>Configure system security parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="2fa" className="text-text-primary">Two-Factor Authentication</Label>
                    <p className="text-sm text-text-secondary">Require 2FA for all admin users</p>
                  </div>
                  <Switch id="2fa" checked={securitySettings.twoFactorAuth} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ip-whitelist" className="text-text-primary">IP Whitelisting</Label>
                    <p className="text-sm text-text-secondary">Restrict access to specific IPs</p>
                  </div>
                  <Switch id="ip-whitelist" checked={securitySettings.ipWhitelisting} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="audit-log" className="text-text-primary">Audit Logging</Label>
                    <p className="text-sm text-text-secondary">Log all administrative actions</p>
                  </div>
                  <Switch id="audit-log" checked={securitySettings.auditLogging} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="encryption" className="text-text-primary">Encryption at Rest</Label>
                    <p className="text-sm text-text-secondary">Encrypt all stored data</p>
                  </div>
                  <Switch id="encryption" checked={securitySettings.encryptionAtRest} />
                </div>
              </div>

              <Alert className="bg-dark-tertiary border-yellow-500">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-text-primary">
                  Changing security settings will require all users to re-authenticate.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <h4 className="font-medium text-text-primary mb-2">Database Info</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-text-secondary">Type: <span className="text-text-primary">PostgreSQL</span></p>
                    <p className="text-text-secondary">Version: <span className="text-text-primary">15.2</span></p>
                    <p className="text-text-secondary">Size: <span className="text-text-primary">1.2 GB</span></p>
                    <p className="text-text-secondary">Tables: <span className="text-text-primary">4</span></p>
                  </div>
                </div>

                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <h4 className="font-medium text-text-primary mb-2">Connection Pool</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-text-secondary">Active: <span className="text-text-primary">12</span></p>
                    <p className="text-text-secondary">Idle: <span className="text-text-primary">8</span></p>
                    <p className="text-text-secondary">Max: <span className="text-text-primary">50</span></p>
                    <p className="text-text-secondary">Wait Queue: <span className="text-text-primary">0</span></p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Activity className="mr-2 h-4 w-4" />
                  Run Maintenance
                </Button>
                <Button variant="outline" className="flex-1">
                  Backup Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Audit Logs</CardTitle>
              <CardDescription>Track all administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { user: 'Admin', action: 'Updated security settings', time: '5 minutes ago', type: 'security' },
                  { user: 'Sarah Chen', action: 'Created new user account', time: '2 hours ago', type: 'user' },
                  { user: 'Admin', action: 'Backed up database', time: '1 day ago', type: 'database' },
                  { user: 'Mike Johnson', action: 'Modified user permissions', time: '2 days ago', type: 'user' },
                  { user: 'Admin', action: 'System maintenance completed', time: '3 days ago', type: 'system' }
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-dark-tertiary rounded">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${
                        log.type === 'security' ? 'bg-red-500/20' :
                        log.type === 'user' ? 'bg-blue-500/20' :
                        log.type === 'database' ? 'bg-green-500/20' :
                        'bg-gray-500/20'
                      }`}>
                        {log.type === 'security' && <Lock className="h-3 w-3 text-red-400" />}
                        {log.type === 'user' && <Users className="h-3 w-3 text-blue-400" />}
                        {log.type === 'database' && <Database className="h-3 w-3 text-green-400" />}
                        {log.type === 'system' && <Settings className="h-3 w-3 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-text-primary">
                          <span className="font-medium">{log.user}</span> {log.action}
                        </p>
                        <p className="text-xs text-text-secondary">{log.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}