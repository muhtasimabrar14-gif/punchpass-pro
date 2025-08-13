import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useOrganizations } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: organizations = [] } = useOrganizations();

  const selectedOrgData = organizations.find(org => org.id === selectedOrg);

  const copyEmbedCode = async () => {
    if (!selectedOrg) {
      toast({
        title: "No organization selected",
        description: "Please select an organization first.",
        variant: "destructive",
      });
      return;
    }

    const embedCode = `<iframe src="${window.location.origin}/embed/${selectedOrg}" width="100%" height="620" frameborder="0" style="border-radius: 8px;"></iframe>`;
    
    try {
      await navigator.clipboard.writeText(embedCode);
      toast({ title: "Embed code copied to clipboard!" });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const openEmbedPreview = () => {
    if (!selectedOrg) {
      toast({
        title: "No organization selected",
        description: "Please select an organization first.",
        variant: "destructive",
      });
      return;
    }
    
    window.open(`/embed/${selectedOrg}`, '_blank');
  };

  return (
    <main className="container py-10 space-y-8">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={profile?.display_name || ''} disabled />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Profile settings are currently read-only. Contact support to make changes.
          </p>
        </CardContent>
      </Card>

      {/* Organization Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrgData && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value={selectedOrgData.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <Input value={selectedOrgData.role} disabled />
                </div>
              </div>
              
              {selectedOrgData.description && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={selectedOrgData.description} disabled />
                </div>
              )}
              
              {selectedOrgData.website && (
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={selectedOrgData.website} disabled />
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                Organization settings are currently read-only. Contact support to make changes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Widget Embed Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Widget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an organization for widget embed" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrg && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Embed Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Copy this code to embed the booking widget on your website
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={openEmbedPreview}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button onClick={copyEmbedCode}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-sm break-all">
                    {`<iframe src="${window.location.origin}/embed/${selectedOrg}" width="100%" height="620" frameborder="0" style="border-radius: 8px;"></iframe>`}
                  </code>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Widget URL</h4>
                  <div className="flex">
                    <Input
                      value={`${window.location.origin}/embed/${selectedOrg}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      className="ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/embed/${selectedOrg}`);
                        toast({ title: "URL copied to clipboard!" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle>API & Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Stripe Integration</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Connect Stripe to accept payments for class bookings.
              </p>
              <Button variant="outline" disabled>
                Connect Stripe (Coming Soon)
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Email Notifications</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Set up email notifications for bookings and cancellations.
              </p>
              <Button variant="outline" disabled>
                Configure Email (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Settings;