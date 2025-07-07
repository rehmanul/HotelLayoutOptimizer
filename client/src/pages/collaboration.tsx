import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, MessageSquare, Share2, UserPlus, Shield, 
  Clock, CheckCircle, AlertCircle, Edit, Trash2 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Collaboration() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [comment, setComment] = useState("");

  const teamMembers = [
    { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'Owner', avatar: null, status: 'active' },
    { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', role: 'Editor', avatar: null, status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Viewer', avatar: null, status: 'active' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'Editor', avatar: null, status: 'pending' },
  ];

  const recentActivity = [
    { user: 'Sarah Chen', action: 'modified floor plan', project: 'Office Building A', time: '2 hours ago', icon: Edit },
    { user: 'Mike Johnson', action: 'added comment', project: 'Retail Space B', time: '4 hours ago', icon: MessageSquare },
    { user: 'Admin User', action: 'exported PDF', project: 'Warehouse Complex', time: '1 day ago', icon: Share2 },
    { user: 'Emily Davis', action: 'joined the workspace', project: null, time: '2 days ago', icon: UserPlus },
  ];

  const projectShares = [
    { id: 1, name: 'Office Building A', sharedWith: 3, lastModified: '2 hours ago', status: 'active' },
    { id: 2, name: 'Retail Space B', sharedWith: 2, lastModified: '1 day ago', status: 'active' },
    { id: 3, name: 'Warehouse Complex', sharedWith: 4, lastModified: '3 days ago', status: 'archived' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Users className="h-10 w-10 text-accent-blue" />
          Collaboration
        </h1>
        <p className="text-text-secondary">Manage team members and collaborate on projects</p>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="bg-dark-tertiary">
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="sharing">Project Sharing</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Invite Team Member</CardTitle>
              <CardDescription>Add new collaborators to your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-dark-tertiary"
                />
                <Select defaultValue="editor">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-accent-blue hover:bg-accent-blue/90">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Team Members</CardTitle>
              <CardDescription>Manage access and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-dark-tertiary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-text-primary">{member.name}</p>
                        <p className="text-sm text-text-secondary">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.status === 'pending' && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                          Pending
                        </Badge>
                      )}
                      <Badge variant={member.role === 'Owner' ? 'default' : 'secondary'}>
                        <Shield className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                      {member.role !== 'Owner' && (
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Recent Activity</CardTitle>
              <CardDescription>Track team actions and project updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-dark-tertiary rounded-lg">
                    <div className="p-2 bg-dark-secondary rounded-full">
                      <activity.icon className="h-4 w-4 text-accent-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary">
                        <span className="font-medium">{activity.user}</span>
                        {' '}{activity.action}
                        {activity.project && (
                          <span className="text-accent-blue"> on {activity.project}</span>
                        )}
                      </p>
                      <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Shared Projects</CardTitle>
              <CardDescription>Manage project access and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectShares.map((project) => (
                  <div key={project.id} className="p-4 bg-dark-tertiary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-text-primary">{project.name}</h4>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        Shared with {project.sharedWith} team members
                      </span>
                      <span className="text-text-secondary">
                        Last modified {project.lastModified}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Users className="mr-2 h-3 w-3" />
                        Manage Access
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="mr-2 h-3 w-3" />
                        Share Link
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-dark-tertiary border-accent-blue">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-text-primary">
              <strong>Pro Tip:</strong> Use project sharing to collaborate with external stakeholders while maintaining control over access permissions.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardHeader>
              <CardTitle className="text-text-primary">Project Comments</CardTitle>
              <CardDescription>Discuss and provide feedback on projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-dark-tertiary"
                  rows={3}
                />
                <Button className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Post Comment
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { user: 'Sarah Chen', comment: 'Great work on the corridor optimization! The flow is much better now.', time: '1 hour ago' },
                  { user: 'Mike Johnson', comment: 'Can we increase the îlot density in the northwest section?', time: '3 hours ago' },
                  { user: 'Admin User', comment: 'Approved for final review. Please generate the PDF report.', time: '1 day ago' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-dark-tertiary rounded-lg">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{item.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-text-primary">{item.user}</p>
                          <p className="text-xs text-text-secondary">{item.time}</p>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{item.comment}</p>
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