import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, Calendar, Filter, Search, 
  TrendingUp, Building, Clock, CheckCircle, AlertCircle 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");

  const generatedReports = [
    {
      id: 1,
      name: 'Monthly Analysis Summary - December 2024',
      type: 'Monthly Summary',
      createdAt: new Date('2024-12-31'),
      size: '2.4 MB',
      status: 'completed',
      projects: 12,
      analyses: 45
    },
    {
      id: 2,
      name: 'Office Building A - Final Report',
      type: 'Project Report',
      createdAt: new Date('2025-01-05'),
      size: '1.8 MB',
      status: 'completed',
      projects: 1,
      analyses: 8
    },
    {
      id: 3,
      name: 'Q4 2024 Performance Analysis',
      type: 'Quarterly Report',
      createdAt: new Date('2024-12-28'),
      size: '3.2 MB',
      status: 'completed',
      projects: 38,
      analyses: 156
    },
    {
      id: 4,
      name: 'Space Utilization Trends 2024',
      type: 'Annual Report',
      createdAt: new Date('2024-12-20'),
      size: '5.6 MB',
      status: 'processing',
      projects: 156,
      analyses: 524
    }
  ];

  const reportTemplates = [
    {
      name: 'Executive Summary',
      description: 'High-level overview for stakeholders',
      fields: ['Key Metrics', 'Trends', 'Recommendations'],
      icon: TrendingUp
    },
    {
      name: 'Technical Analysis',
      description: 'Detailed technical breakdown',
      fields: ['Zone Analysis', 'Îlot Distribution', 'Efficiency Metrics'],
      icon: Building
    },
    {
      name: 'Compliance Report',
      description: 'Safety and regulatory compliance',
      fields: ['Safety Standards', 'Accessibility', 'Emergency Routes'],
      icon: CheckCircle
    },
    {
      name: 'Performance Report',
      description: 'System and process performance',
      fields: ['Processing Times', 'Success Rates', 'Error Analysis'],
      icon: Clock
    }
  ];

  const scheduledReports = [
    { name: 'Weekly Summary', frequency: 'Every Monday', nextRun: 'In 3 days', recipients: 4 },
    { name: 'Monthly Analysis', frequency: 'First of month', nextRun: 'In 2 weeks', recipients: 8 },
    { name: 'Project Updates', frequency: 'Daily', nextRun: 'Tomorrow 9 AM', recipients: 2 }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <FileText className="h-10 w-10 text-accent-blue" />
          Reports
        </h1>
        <p className="text-text-secondary">Generate, view, and manage comprehensive reports</p>
      </div>

      <Tabs defaultValue="generated" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList className="bg-dark-tertiary">
            <TabsTrigger value="generated">Generated Reports</TabsTrigger>
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
            <TabsTrigger value="custom">Custom Report Builder</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-dark-tertiary"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="generated" className="space-y-6">
          <div className="grid gap-4">
            {generatedReports.map((report) => (
              <Card key={report.id} className="bg-dark-secondary border-dark-tertiary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-accent-blue" />
                        <h3 className="font-medium text-text-primary">{report.name}</h3>
                        <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(report.createdAt, 'MMM dd, yyyy')}
                        </span>
                        <span>{report.type}</span>
                        <span>{report.size}</span>
                        <span>{report.projects} projects • {report.analyses} analyses</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="py-8 text-center">
              <Button size="lg" className="bg-accent-blue hover:bg-accent-blue/90">
                <FileText className="mr-2 h-5 w-5" />
                Generate New Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTemplates.map((template, idx) => (
              <Card key={idx} className="bg-dark-secondary border-dark-tertiary hover:border-accent-blue transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <template.icon className="h-5 w-5 text-accent-blue" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-text-secondary">Includes:</p>
                    <ul className="text-sm text-text-secondary space-y-1">
                      {template.fields.map((field, fieldIdx) => (
                        <li key={fieldIdx} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-accent-green" />
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full" variant="outline">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Automated Reports</CardTitle>
              <CardDescription>Set up recurring reports to be generated automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.map((schedule, idx) => (
                  <div key={idx} className="p-4 bg-dark-tertiary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-text-primary">{schedule.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {schedule.frequency}
                          </span>
                          <span>Next: {schedule.nextRun}</span>
                          <span>{schedule.recipients} recipients</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Pause</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-6" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Create Scheduled Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Custom Report Builder</CardTitle>
              <CardDescription>Create a tailored report with specific metrics and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Report Name</label>
                <Input 
                  placeholder="Enter report name" 
                  className="bg-dark-tertiary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" className="bg-dark-tertiary" />
                  <Input type="date" className="bg-dark-tertiary" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Project Selection</label>
                <Select>
                  <SelectTrigger className="bg-dark-tertiary">
                    <SelectValue placeholder="Select projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="active">Active Projects Only</SelectItem>
                    <SelectItem value="specific">Select Specific Projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Include Sections</label>
                <div className="space-y-2">
                  {['Executive Summary', 'Detailed Analytics', 'Zone Analysis', 'Îlot Distribution', 'Performance Metrics', 'Recommendations'].map((section) => (
                    <label key={section} className="flex items-center gap-2 text-text-secondary">
                      <input type="checkbox" className="rounded" defaultChecked />
                      {section}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Export Format</label>
                <Select defaultValue="pdf">
                  <SelectTrigger className="bg-dark-tertiary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="word">Word Document</SelectItem>
                    <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" size="lg">
                Generate Custom Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}