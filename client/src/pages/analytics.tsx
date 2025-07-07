import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { TrendingUp, Users, Building, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Analytics() {
  const dailyData = [
    { date: 'Mon', projects: 12, analyses: 45, efficiency: 87 },
    { date: 'Tue', projects: 15, analyses: 52, efficiency: 89 },
    { date: 'Wed', projects: 18, analyses: 61, efficiency: 91 },
    { date: 'Thu', projects: 14, analyses: 48, efficiency: 88 },
    { date: 'Fri', projects: 20, analyses: 68, efficiency: 93 },
    { date: 'Sat', projects: 8, analyses: 28, efficiency: 85 },
    { date: 'Sun', projects: 6, analyses: 22, efficiency: 84 },
  ];

  const spaceDistribution = [
    { name: '0-1 m²', value: 25, color: '#3b82f6' },
    { name: '1-3 m²', value: 35, color: '#22c55e' },
    { name: '3-5 m²', value: 25, color: '#fb923c' },
    { name: '5-10 m²', value: 15, color: '#ef4444' },
  ];

  const performanceMetrics = [
    { metric: 'Avg Processing Time', value: '1.2s', trend: '-15%', positive: true },
    { metric: 'Space Utilization', value: '89%', trend: '+5%', positive: true },
    { metric: 'Îlot Density', value: '45/m²', trend: '+12%', positive: true },
    { metric: 'Error Rate', value: '0.3%', trend: '-8%', positive: true },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Analytics Dashboard</h1>
        <p className="text-text-secondary">Track performance metrics and analyze usage patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Projects', value: '156', icon: Building, change: '+12%' },
          { title: 'Active Users', value: '48', icon: Users, change: '+8%' },
          { title: 'Analyses Run', value: '524', icon: TrendingUp, change: '+23%' },
          { title: 'This Month', value: '89', icon: Calendar, change: '+15%' },
        ].map((stat, idx) => (
          <Card key={idx} className="bg-dark-secondary border-dark-tertiary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-text-secondary">
                <stat.icon className="inline h-4 w-4 mr-2" />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <p className="text-xs text-accent-green mt-1">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList className="bg-dark-tertiary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            <TabsTrigger value="reports">Custom Reports</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select defaultValue="7d">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary">Daily Activity</CardTitle>
                <CardDescription>Projects and analyses over the last week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="projects" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="analyses" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardHeader>
                <CardTitle className="text-text-primary">Space Distribution</CardTitle>
                <CardDescription>Îlot size distribution across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spaceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {spaceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Efficiency Trends</CardTitle>
              <CardDescription>Space utilization efficiency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="efficiency" fill="#fb923c" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceMetrics.map((metric, idx) => (
              <Card key={idx} className="bg-dark-secondary border-dark-tertiary">
                <CardHeader>
                  <CardTitle className="text-text-primary text-lg">{metric.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold text-text-primary">{metric.value}</div>
                    <div className={`text-sm font-medium ${metric.positive ? 'text-accent-green' : 'text-accent-orange'}`}>
                      {metric.trend}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Feature Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { feature: 'DXF Upload', usage: 98, count: '512' },
                  { feature: 'AI Optimization', usage: 76, count: '398' },
                  { feature: 'PDF Export', usage: 89, count: '465' },
                  { feature: 'Collaboration', usage: 45, count: '235' },
                  { feature: 'Custom Reports', usage: 34, count: '178' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-primary">{item.feature}</span>
                      <span className="text-text-secondary">{item.count} uses</span>
                    </div>
                    <div className="w-full bg-dark-tertiary rounded-full h-2">
                      <div 
                        className="bg-accent-blue h-2 rounded-full transition-all"
                        style={{ width: `${item.usage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Generate Custom Report</CardTitle>
              <CardDescription>Create detailed analytics reports for specific date ranges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary">Start Date</label>
                  <input type="date" className="w-full mt-1 bg-dark-tertiary text-text-primary rounded px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm text-text-secondary">End Date</label>
                  <input type="date" className="w-full mt-1 bg-dark-tertiary text-text-primary rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-sm text-text-secondary">Report Type</label>
                <Select defaultValue="comprehensive">
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                    <SelectItem value="performance">Performance Report</SelectItem>
                    <SelectItem value="usage">Usage Statistics</SelectItem>
                    <SelectItem value="financial">Financial Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Generate Report</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}