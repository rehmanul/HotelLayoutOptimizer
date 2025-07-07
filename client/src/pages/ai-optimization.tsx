import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Sparkles, Zap, TrendingUp, RefreshCw, Settings2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AIOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [aiSettings, setAiSettings] = useState({
    aggressiveness: 50,
    prioritizeSpace: true,
    prioritizeSafety: true,
    adaptiveLayout: true,
    learningMode: false
  });

  const startOptimization = () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    // Simulate optimization progress
    const interval = setInterval(() => {
      setOptimizationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsOptimizing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Brain className="h-10 w-10 text-accent-blue" />
          AI Optimization
        </h1>
        <p className="text-text-secondary">Leverage artificial intelligence to optimize your floor plan layouts</p>
      </div>

      <Tabs defaultValue="optimize" className="space-y-6">
        <TabsList className="bg-dark-tertiary">
          <TabsTrigger value="optimize">Optimize Layout</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="settings">AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="optimize" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent-blue" />
                Smart Layout Optimization
              </CardTitle>
              <CardDescription>AI will analyze and optimize your floor plan for maximum efficiency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isOptimizing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Optimizing layout...</span>
                    <span className="text-sm font-medium text-text-primary">{optimizationProgress}%</span>
                  </div>
                  <Progress value={optimizationProgress} className="h-2" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-dark-tertiary rounded-lg">
                      <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                      <p className="text-sm text-text-secondary">Analyzing space utilization</p>
                    </div>
                    <div className="p-4 bg-dark-tertiary rounded-lg">
                      <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-sm text-text-secondary">Optimizing îlot placement</p>
                    </div>
                    <div className="p-4 bg-dark-tertiary rounded-lg">
                      <RefreshCw className="h-8 w-8 text-blue-500 mb-2 animate-spin" />
                      <p className="text-sm text-text-secondary">Generating optimal corridors</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="mx-auto h-16 w-16 text-accent-blue mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">Ready to Optimize</h3>
                  <p className="text-text-secondary mb-6">AI will analyze your floor plan and suggest improvements</p>
                  <Button onClick={startOptimization} size="lg" className="bg-accent-blue hover:bg-accent-blue/90">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start AI Optimization
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary text-lg">Space Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-green mb-2">92%</div>
                <p className="text-sm text-text-secondary">Current utilization rate</p>
              </CardContent>
            </Card>

            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary text-lg">Optimization Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-blue mb-2">+15%</div>
                <p className="text-sm text-text-secondary">Possible improvement</p>
              </CardContent>
            </Card>

            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary text-lg">AI Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-orange mb-2">98%</div>
                <p className="text-sm text-text-secondary">Solution reliability</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">AI-Generated Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-dark-tertiary border-accent-blue">
                <Sparkles className="h-4 w-4" />
                <AlertDescription className="text-text-primary">
                  <strong>Optimization Opportunity:</strong> The eastern section of your floor plan has 23% unused space that could accommodate 8 additional small îlots.
                </AlertDescription>
              </Alert>

              <Alert className="bg-dark-tertiary border-accent-green">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription className="text-text-primary">
                  <strong>Corridor Efficiency:</strong> Current corridor layout is 87% efficient. Slight adjustments could improve flow by 12%.
                </AlertDescription>
              </Alert>

              <Alert className="bg-dark-tertiary border-accent-orange">
                <Zap className="h-4 w-4" />
                <AlertDescription className="text-text-primary">
                  <strong>Safety Enhancement:</strong> Adding 2 additional emergency exits would improve evacuation efficiency by 34%.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">AI Recommendations</CardTitle>
              <CardDescription>Actionable suggestions to improve your floor plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Reorganize Northwest Quadrant",
                    impact: "High",
                    improvement: "+18% space utilization",
                    description: "Rotating îlots by 90° would create more efficient corridors"
                  },
                  {
                    title: "Merge Small Corridors",
                    impact: "Medium",
                    improvement: "+12% flow efficiency",
                    description: "Combining parallel corridors would improve traffic flow"
                  },
                  {
                    title: "Add Central Hub",
                    impact: "High",
                    improvement: "+25% accessibility",
                    description: "A central distribution point would reduce average distances"
                  }
                ].map((suggestion, idx) => (
                  <div key={idx} className="p-4 bg-dark-tertiary rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-text-primary">{suggestion.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        suggestion.impact === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {suggestion.impact} Impact
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mb-1">{suggestion.description}</p>
                    <p className="text-sm font-medium text-accent-green">{suggestion.improvement}</p>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-6" variant="outline">
                Apply All Suggestions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                AI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-text-primary mb-2 block">Optimization Aggressiveness</Label>
                  <Slider
                    value={[aiSettings.aggressiveness]}
                    onValueChange={([value]) => setAiSettings(prev => ({ ...prev, aggressiveness: value }))}
                    max={100}
                    step={10}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Conservative</span>
                    <span>{aiSettings.aggressiveness}%</span>
                    <span>Aggressive</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prioritize-space" className="text-text-primary">Prioritize Space Utilization</Label>
                    <Switch
                      id="prioritize-space"
                      checked={aiSettings.prioritizeSpace}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, prioritizeSpace: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="prioritize-safety" className="text-text-primary">Prioritize Safety Compliance</Label>
                    <Switch
                      id="prioritize-safety"
                      checked={aiSettings.prioritizeSafety}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, prioritizeSafety: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="adaptive-layout" className="text-text-primary">Adaptive Layout Generation</Label>
                    <Switch
                      id="adaptive-layout"
                      checked={aiSettings.adaptiveLayout}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, adaptiveLayout: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="learning-mode" className="text-text-primary">Enable Learning Mode</Label>
                    <Switch
                      id="learning-mode"
                      checked={aiSettings.learningMode}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, learningMode: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Alert className="bg-dark-tertiary border-dark-tertiary">
                <AlertDescription className="text-text-secondary text-sm">
                  Learning Mode allows the AI to improve its optimization strategies based on your feedback and usage patterns.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}