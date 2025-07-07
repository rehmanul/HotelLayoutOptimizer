import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BarChart, Building, Clock } from "lucide-react";
import type { Analysis } from "@shared/schema";

export default function Results() {
  const { data: analyses = [] } = useQuery<Analysis[]>({
    queryKey: ['/api/analyses']
  });

  const latestAnalysis = analyses[0];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Analysis Results</h1>
        <p className="text-text-secondary">View and export your floor plan analysis results</p>
      </div>

      {latestAnalysis ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-dark-tertiary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-dark-secondary border-dark-tertiary">
                <CardHeader>
                  <CardTitle className="text-text-primary">Total Îlots</CardTitle>
                  <CardDescription>Optimally placed units</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent-blue">{latestAnalysis.totalIlots || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-dark-secondary border-dark-tertiary">
                <CardHeader>
                  <CardTitle className="text-text-primary">Coverage Rate</CardTitle>
                  <CardDescription>Space utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-accent-green">{latestAnalysis.coverage || 0}%</div>
                    <Progress value={latestAnalysis.coverage || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dark-secondary border-dark-tertiary">
                <CardHeader>
                  <CardTitle className="text-text-primary">Analysis Status</CardTitle>
                  <CardDescription>Current state</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={latestAnalysis.status === 'completed' ? 'default' : 'secondary'}>
                    {latestAnalysis.status}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary">Zone Detection Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-dark-tertiary rounded-lg">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Walls Detected</h4>
                    <p className="text-2xl font-bold text-text-primary">
                      {latestAnalysis.zonesDetected?.walls?.length || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-tertiary rounded-lg">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Restricted Areas</h4>
                    <p className="text-2xl font-bold text-accent-orange">
                      {latestAnalysis.zonesDetected?.restricted?.length || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-tertiary rounded-lg">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Entrances/Exits</h4>
                    <p className="text-2xl font-bold text-accent-green">
                      {latestAnalysis.zonesDetected?.entrances?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Processing Time</span>
                    <span className="text-text-primary font-medium">
                      <Clock className="inline w-4 h-4 mr-1" />
                      {latestAnalysis.completedAt ? '< 1 second' : 'Processing...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Îlots Placed</span>
                    <span className="text-text-primary font-medium">{latestAnalysis.ilotsPlaced?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Corridors Generated</span>
                    <span className="text-text-primary font-medium">{latestAnalysis.corridorsGenerated?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary">Export Options</CardTitle>
                <CardDescription>Download your analysis in various formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export as PNG Image
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart className="mr-2 h-4 w-4" />
                  Export Analysis Data (CSV)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Building className="mr-2 h-4 w-4" />
                  Export DXF with Îlots
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="bg-dark-secondary border-dark-tertiary">
          <CardContent className="py-16 text-center">
            <Building className="mx-auto h-12 w-12 text-text-secondary mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No Analysis Results Yet</h3>
            <p className="text-text-secondary">Upload a floor plan and run an analysis to see results here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}