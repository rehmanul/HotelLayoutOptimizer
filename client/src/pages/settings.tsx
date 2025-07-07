import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, User, Bell, Palette, Globe, 
  Shield, CreditCard, HelpCircle, LogOut, Save 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    company: 'Professional Floor Plan Co.',
    phone: '+1 (555) 123-4567'
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    desktopNotifications: false,
    analysisAlerts: true,
    weeklyReports: true,
    theme: 'dark',
    language: 'en',
    timezone: 'UTC-5',
    dateFormat: 'MM/DD/YYYY'
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferences Saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <SettingsIcon className="h-10 w-10 text-accent-blue" />
          Settings
        </h1>
        <p className="text-text-secondary">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-dark-tertiary">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="help">Help & Support</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-text-primary">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 bg-dark-tertiary"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-text-primary">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 bg-dark-tertiary"
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-text-primary">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    className="mt-1 bg-dark-tertiary"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-text-primary">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 bg-dark-tertiary"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveProfile} className="bg-accent-blue hover:bg-accent-blue/90">
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Enable Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-500 border-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out of All Devices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme" className="text-text-primary">Theme</Label>
                <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                  <SelectTrigger id="theme" className="mt-1 bg-dark-tertiary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language" className="text-text-primary">Language</Label>
                <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger id="language" className="mt-1 bg-dark-tertiary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone" className="text-text-primary">Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger id="timezone" className="mt-1 bg-dark-tertiary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="UTC+0">UTC</SelectItem>
                    <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFormat" className="text-text-primary">Date Format</Label>
                <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences(prev => ({ ...prev, dateFormat: value }))}>
                  <SelectTrigger id="dateFormat" className="mt-1 bg-dark-tertiary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button onClick={handleSavePreferences} className="bg-accent-blue hover:bg-accent-blue/90">
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notif" className="text-text-primary">Email Notifications</Label>
                    <p className="text-sm text-text-secondary">Receive updates via email</p>
                  </div>
                  <Switch
                    id="email-notif"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="desktop-notif" className="text-text-primary">Desktop Notifications</Label>
                    <p className="text-sm text-text-secondary">Show browser notifications</p>
                  </div>
                  <Switch
                    id="desktop-notif"
                    checked={preferences.desktopNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, desktopNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analysis-alerts" className="text-text-primary">Analysis Alerts</Label>
                    <p className="text-sm text-text-secondary">Notify when analysis completes</p>
                  </div>
                  <Switch
                    id="analysis-alerts"
                    checked={preferences.analysisAlerts}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analysisAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-reports" className="text-text-primary">Weekly Reports</Label>
                    <p className="text-sm text-text-secondary">Receive weekly usage summaries</p>
                  </div>
                  <Switch
                    id="weekly-reports"
                    checked={preferences.weeklyReports}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-dark-tertiary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-text-primary">Current Plan</h4>
                  <Badge className="bg-accent-blue">Enterprise</Badge>
                </div>
                <p className="text-sm text-text-secondary mb-4">Unlimited projects, advanced features, priority support</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Monthly Cost</span>
                  <span className="text-text-primary font-medium">$299/month</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Update Payment Method
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  View Billing History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Download Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">API Keys</CardTitle>
              <CardDescription>Manage your API keys for external integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-dark-tertiary border-dark-tertiary">
                <AlertDescription className="text-text-secondary">
                  API keys provide access to your floor plan data. Keep them secure and rotate regularly.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-text-primary">Production API Key</h4>
                    <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>
                  </div>
                  <code className="text-xs text-text-secondary font-mono">sk_prod_••••••••••••••••••••••••••••</code>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Regenerate</Button>
                    <Button size="sm" variant="outline">Revoke</Button>
                  </div>
                </div>

                <div className="p-4 bg-dark-tertiary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-text-primary">Development API Key</h4>
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500">Test Mode</Badge>
                  </div>
                  <code className="text-xs text-text-secondary font-mono">sk_test_••••••••••••••••••••••••••••</code>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Regenerate</Button>
                    <Button size="sm" variant="outline">Revoke</Button>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Create New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <div className="text-left">
                    <h4 className="font-medium text-text-primary mb-1">Documentation</h4>
                    <p className="text-sm text-text-secondary">Browse our comprehensive guides</p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-4 justify-start">
                  <div className="text-left">
                    <h4 className="font-medium text-text-primary mb-1">Video Tutorials</h4>
                    <p className="text-sm text-text-secondary">Learn with step-by-step videos</p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-4 justify-start">
                  <div className="text-left">
                    <h4 className="font-medium text-text-primary mb-1">Contact Support</h4>
                    <p className="text-sm text-text-secondary">Get help from our team</p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-4 justify-start">
                  <div className="text-left">
                    <h4 className="font-medium text-text-primary mb-1">API Reference</h4>
                    <p className="text-sm text-text-secondary">Technical integration docs</p>
                  </div>
                </Button>
              </div>

              <Alert className="bg-dark-tertiary border-accent-blue">
                <AlertDescription className="text-text-primary">
                  <strong>Need immediate help?</strong> Our support team is available 24/7 for Enterprise customers. 
                  Email us at support@floorplananalyzer.com
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}