import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Users, 
  Mail, 
  Shield, 
  Trash2, 
  UserPlus,
  Crown,
  Settings,
  Eye
} from "lucide-react";
import { useOrganizationMembers, useInviteUser, useUpdateMemberRole, useRemoveMember } from "@/hooks/useTeamManagement";
import { toast } from "@/hooks/use-toast";

interface TeamManagementProps {
  organizationId: string;
  currentUserRole: string;
}

const TeamManagement = ({ organizationId, currentUserRole }: TeamManagementProps) => {
  const [isInviting, setIsInviting] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
  });

  const { data: members = [] } = useOrganizationMembers(organizationId);
  const inviteUser = useInviteUser();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const handleInvite = async () => {
    if (!inviteData.email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      await inviteUser.mutateAsync({
        organization_id: organizationId,
        email: inviteData.email,
        role: inviteData.role,
      });

      toast({ title: "Invitation sent!" });
      setIsInviting(false);
      setInviteData({ email: '', role: 'member' });
    } catch (error: any) {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRoleUpdate = async (memberId: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({
        member_id: memberId,
        role: newRole as 'owner' | 'admin' | 'member',
      });

      toast({ title: "Role updated successfully!" });
    } catch (error: any) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      await removeMember.mutateAsync(memberId);
      toast({ title: "Team member removed" });
    } catch (error: any) {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageRole = (memberRole: string) => {
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && memberRole === 'member') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">
            Manage team members and their access levels
          </p>
        </div>
        
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <Dialog open={isInviting} onOpenChange={setIsInviting}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="colleague@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select
                    value={inviteData.role}
                    onValueChange={(value: 'owner' | 'admin' | 'member') => 
                      setInviteData(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member - View classes and bookings</SelectItem>
                      <SelectItem value="admin">Admin - Manage classes and members</SelectItem>
                      {currentUserRole === 'owner' && (
                        <SelectItem value="owner">Owner - Full access</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleInvite} className="w-full" disabled={inviteUser.isPending}>
                  {inviteUser.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Members List */}
      <div className="grid gap-4">
        {members.map((member: any) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {member.profiles?.display_name?.[0] || member.profiles?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">
                        {member.profiles?.display_name || member.profiles?.email}
                      </h3>
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 mr-1" />
                      {member.profiles?.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className={getRoleColor(member.role)}>
                    {member.role}
                  </Badge>
                  
                  {canManageRole(member.role) && (
                    <div className="flex items-center space-x-2">
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => handleRoleUpdate(member.id, newRole)}
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {currentUserRole === 'owner' && (
                            <SelectItem value="owner">Owner</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {member.role !== 'owner' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemove(member.id, member.profiles?.display_name || member.profiles?.email)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="ml-2">{new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last active:</span>
                    <span className="ml-2">{new Date(member.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Permissions Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-medium">Owner</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Full access to all features</li>
                  <li>• Manage team members and roles</li>
                  <li>• Access billing and settings</li>
                  <li>• Delete organization</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium">Admin</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create and manage classes</li>
                  <li>• View all bookings and members</li>
                  <li>• Manage calendar integrations</li>
                  <li>• Access analytics</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <h4 className="font-medium">Member</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View classes and bookings</li>
                  <li>• Check-in students via QR</li>
                  <li>• View basic analytics</li>
                  <li>• Limited settings access</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;