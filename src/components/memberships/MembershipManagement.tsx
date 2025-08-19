import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, CreditCard, Clock, Users } from "lucide-react";
import { useMemberships, useCreateMembership } from "@/hooks/useMemberships";
import { toast } from "@/hooks/use-toast";

interface MembershipManagementProps {
  organizationId: string;
}

const MembershipManagement = ({ organizationId }: MembershipManagementProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'class_pack' as 'unlimited' | 'class_pack' | 'trial',
    price: 0,
    class_credits: 10,
    duration_days: 30,
    is_recurring: false,
  });

  const { data: memberships = [] } = useMemberships(organizationId);
  const createMembership = useCreateMembership();

  const handleCreate = async () => {
    if (!formData.name) {
      toast({
        title: "Name required",
        description: "Please enter a membership name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMembership.mutateAsync({
        organization_id: organizationId,
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        price: formData.price,
        currency: 'USD',
        class_credits: formData.type === 'unlimited' ? null : formData.class_credits,
        duration_days: formData.duration_days,
        is_recurring: formData.is_recurring,
      });

      toast({ title: "Membership created successfully!" });
      setIsCreating(false);
      setFormData({
        name: '',
        description: '',
        type: 'class_pack',
        price: 0,
        class_credits: 10,
        duration_days: 30,
        is_recurring: false,
      });
    } catch (error: any) {
      toast({
        title: "Error creating membership",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Membership Plans</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="h-4 w-4 mr-2" />
              New Membership
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Membership</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="10-Class Pack"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Perfect for regular attendees..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'unlimited' | 'class_pack' | 'trial') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class_pack">Class Pack</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                {formData.type !== 'unlimited' && (
                  <div className="space-y-2">
                    <Label htmlFor="credits">Class Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      value={formData.class_credits}
                      onChange={(e) => setFormData(prev => ({ ...prev, class_credits: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 30 }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
                />
                <Label htmlFor="recurring">Recurring subscription</Label>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={createMembership.isPending}>
                {createMembership.isPending ? 'Creating...' : 'Create Membership'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No memberships yet</h3>
            <p className="text-muted-foreground mb-4">
              Create membership plans to offer passes and recurring subscriptions.
            </p>
            <Button variant="hero" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Membership
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map((membership) => (
            <Card key={membership.id} className="card-elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{membership.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">
                      {membership.type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${membership.price}</p>
                    {membership.is_recurring && (
                      <p className="text-xs text-muted-foreground">recurring</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {membership.description && (
                  <p className="text-sm text-muted-foreground">{membership.description}</p>
                )}
                
                <div className="space-y-2">
                  {membership.class_credits && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{membership.class_credits} classes included</span>
                    </div>
                  )}
                  
                  {membership.type === 'unlimited' && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Unlimited classes</span>
                    </div>
                  )}
                  
                  {membership.duration_days && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Valid for {membership.duration_days} days</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">
                    Created {new Date(membership.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembershipManagement;