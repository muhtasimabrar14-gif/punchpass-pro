import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Users, 
  Settings,
  TrendingDown,
  CheckCircle
} from "lucide-react";
import { useOrganizationSettings, useUpdateOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { useNoShowAnalytics, useProcessNoShows } from "@/hooks/useNoShowManagement";
import { toast } from "@/hooks/use-toast";

interface NoShowManagementProps {
  organizationId: string;
}

const NoShowManagement = ({ organizationId }: NoShowManagementProps) => {
  const [settings, setSettings] = useState({
    no_show_enabled: false,
    no_show_window_minutes: 15,
    penalty_type: 'credit_loss' as 'credit_loss' | 'fee' | 'suspension',
    penalty_amount: 0,
    auto_enforcement: false,
  });

  const { data: orgSettings } = useOrganizationSettings(organizationId);
  const { data: noShowStats } = useNoShowAnalytics(organizationId);
  const updateSettings = useUpdateOrganizationSettings();
  const processNoShows = useProcessNoShows();

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        organization_id: organizationId,
        settings: {
          ...orgSettings?.settings,
          no_show_management: settings,
        },
      });

      toast({ title: "No-show settings updated!" });
    } catch (error: any) {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProcessNoShows = async () => {
    try {
      const result = await processNoShows.mutateAsync(organizationId);
      toast({
        title: "No-shows processed",
        description: `Processed ${result.processed_count} no-shows`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to process no-shows",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">No-Show Management</h2>
          <p className="text-muted-foreground">
            Configure policies to reduce no-shows and manage penalties
          </p>
        </div>
        <Button onClick={handleProcessNoShows} disabled={processNoShows.isPending}>
          <Settings className="h-4 w-4 mr-2" />
          {processNoShows.isPending ? 'Processing...' : 'Process No-Shows'}
        </Button>
      </div>

      {/* No-Show Statistics */}
      {noShowStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{noShowStats.no_show_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {noShowStats.no_show_rate < 10 ? 'Excellent' : noShowStats.no_show_rate < 20 ? 'Good' : 'Needs attention'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total No-Shows</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{noShowStats.total_no_shows}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Lost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${noShowStats.revenue_lost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Estimated impact</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repeat Offenders</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{noShowStats.repeat_offenders}</div>
              <p className="text-xs text-muted-foreground">3+ no-shows</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No-Show Policy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>No-Show Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable No-Show Management</h4>
              <p className="text-sm text-muted-foreground">
                Automatically track and penalize no-shows
              </p>
            </div>
            <Switch
              checked={settings.no_show_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, no_show_enabled: checked }))
              }
            />
          </div>

          {settings.no_show_enabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="no-show-window">No-Show Window (minutes)</Label>
                  <Input
                    id="no-show-window"
                    type="number"
                    min="5"
                    max="60"
                    value={settings.no_show_window_minutes}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        no_show_window_minutes: parseInt(e.target.value) || 15 
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Time before class start when no-show is recorded
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penalty-type">Penalty Type</Label>
                  <Select
                    value={settings.penalty_type}
                    onValueChange={(value: 'credit_loss' | 'fee' | 'suspension') => 
                      setSettings(prev => ({ ...prev, penalty_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_loss">Lose Class Credit</SelectItem>
                      <SelectItem value="fee">Monetary Fee</SelectItem>
                      <SelectItem value="suspension">Temporary Suspension</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {settings.penalty_type === 'fee' && (
                <div className="space-y-2">
                  <Label htmlFor="penalty-amount">Penalty Fee ($)</Label>
                  <Input
                    id="penalty-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.penalty_amount}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        penalty_amount: parseFloat(e.target.value) || 0 
                      }))
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Automatic Enforcement</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply penalties automatically without manual review
                  </p>
                </div>
                <Switch
                  checked={settings.auto_enforcement}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, auto_enforcement: checked }))
                  }
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No-show policies help reduce revenue loss and improve class utilization. 
                  Make sure your terms of service clearly communicate these policies to customers.
                </AlertDescription>
              </Alert>

              <Button onClick={handleSaveSettings} className="w-full">
                Save No-Show Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent No-Shows */}
      {noShowStats?.recent_no_shows && noShowStats.recent_no_shows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent No-Shows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {noShowStats.recent_no_shows.map((noShow: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{noShow.user_name}</p>
                      <p className="text-sm text-muted-foreground">{noShow.class_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">No-Show</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(noShow.class_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoShowManagement;