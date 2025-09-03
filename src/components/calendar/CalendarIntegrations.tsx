import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  ExternalLink, 
  Settings, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { 
  useCalendarIntegrations, 
  useCreateCalendarIntegration, 
  useDeleteCalendarIntegration,
  useSyncCalendarEvents,
  useCheckCalendarConflicts
} from "@/hooks/useCalendarIntegrations";
import { toast } from "@/hooks/use-toast";

interface CalendarIntegrationsProps {
  organizationId: string;
}

const CalendarIntegrations = ({ organizationId }: CalendarIntegrationsProps) => {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [showCalendlyDialog, setShowCalendlyDialog] = useState(false);

  const { data: integrations = [] } = useCalendarIntegrations(organizationId);
  const createIntegration = useCreateCalendarIntegration();
  const deleteIntegration = useDeleteCalendarIntegration();
  const syncEvents = useSyncCalendarEvents();
  const checkConflicts = useCheckCalendarConflicts();

  const handleGoogleConnect = async () => {
    setIsConnecting('google');
    
    try {
      // Call Edge Function to initiate Google OAuth
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { 
          organization_id: organizationId,
          action: 'initiate'
        }
      });
      
      if (error) throw error;
      
      // Redirect to Google OAuth
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error: any) {
      toast({
        title: "Failed to connect Google Calendar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(null);
    }
  };

  const handleOutlookConnect = async () => {
    setIsConnecting('outlook');
    
    try {
      // Call Edge Function to initiate Outlook OAuth
      const { data, error } = await supabase.functions.invoke('outlook-calendar-oauth', {
        body: { 
          organization_id: organizationId,
          action: 'initiate'
        }
      });
      
      if (error) throw error;
      
      // Redirect to Microsoft OAuth
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error: any) {
      toast({
        title: "Failed to connect Outlook Calendar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(null);
    }
  };

  const handleCalendlyConnect = async () => {
    if (!calendlyUrl.trim()) {
      toast({
        title: "Calendly URL required",
        description: "Please enter your Calendly profile URL",
        variant: "destructive",
      });
      return;
    }

    try {
      await createIntegration.mutateAsync({
        organization_id: organizationId,
        provider: 'calendly',
        settings: { calendly_url: calendlyUrl },
      });

      toast({ title: "Calendly integration added!" });
      setShowCalendlyDialog(false);
      setCalendlyUrl('');
    } catch (error: any) {
      toast({
        title: "Failed to add Calendly integration",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (integrationId: string, provider: string) => {
    try {
      await deleteIntegration.mutateAsync(integrationId);
      toast({ title: `${provider} calendar disconnected` });
    } catch (error: any) {
      toast({
        title: "Failed to disconnect",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    try {
      await syncEvents.mutateAsync(organizationId);
      toast({ title: "Calendar events synced successfully!" });
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getIntegrationByProvider = (provider: string) => {
    return integrations.find(int => int.provider === provider);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '📅';
      case 'outlook':
        return '📆';
      case 'calendly':
        return '🗓️';
      default:
        return '📋';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Outlook Calendar';
      case 'calendly':
        return 'Calendly';
      default:
        return provider;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendar Integrations</h2>
          <p className="text-muted-foreground">
            Connect external calendars to sync availability and prevent conflicts
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncEvents.isPending || integrations.length === 0}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncEvents.isPending ? 'animate-spin' : ''}`} />
          Sync All
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Calendar integrations help prevent double-bookings by syncing your external calendar events.
          Busy times from connected calendars will block class scheduling automatically.
        </AlertDescription>
      </Alert>

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Google Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">{getProviderIcon('google')}</span>
              <span>Google Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getIntegrationByProvider('google') ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="secondary">Connected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Syncing events and availability
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDisconnect(getIntegrationByProvider('google')!.id, 'Google')}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sync your Google Calendar to prevent scheduling conflicts
                </p>
                <Button
                  onClick={handleGoogleConnect}
                  disabled={isConnecting === 'google'}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isConnecting === 'google' ? 'Connecting...' : 'Connect Google'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outlook Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">{getProviderIcon('outlook')}</span>
              <span>Outlook Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getIntegrationByProvider('outlook') ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="secondary">Connected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Syncing events and availability
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDisconnect(getIntegrationByProvider('outlook')!.id, 'Outlook')}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sync your Outlook Calendar to prevent scheduling conflicts
                </p>
                <Button
                  onClick={handleOutlookConnect}
                  disabled={isConnecting === 'outlook'}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isConnecting === 'outlook' ? 'Connecting...' : 'Connect Outlook'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendly */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">{getProviderIcon('calendly')}</span>
              <span>Calendly</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getIntegrationByProvider('calendly') ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="secondary">Connected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Calendly URL: {getIntegrationByProvider('calendly')?.settings?.calendly_url}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDisconnect(getIntegrationByProvider('calendly')!.id, 'Calendly')}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add your Calendly profile to sync availability
                </p>
                <Dialog open={showCalendlyDialog} onOpenChange={setShowCalendlyDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Calendly
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect Calendly</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="calendly-url">Calendly Profile URL</Label>
                        <Input
                          id="calendly-url"
                          value={calendlyUrl}
                          onChange={(e) => setCalendlyUrl(e.target.value)}
                          placeholder="https://calendly.com/your-username"
                        />
                      </div>
                      <Button onClick={handleCalendlyConnect} className="w-full">
                        Connect Calendly
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Status and Events */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calendar Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getProviderIcon(integration.provider)}</span>
                    <div>
                      <h4 className="font-medium">{getProviderName(integration.provider)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {integration.is_active ? 'Active' : 'Inactive'} • 
                        Last synced: {new Date(integration.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={integration.is_active ? "default" : "secondary"}>
                      {integration.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle active status
                        createIntegration.mutate({
                          ...integration,
                          is_active: !integration.is_active,
                        });
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Conflict Checker */}
      <Card>
        <CardHeader>
          <CardTitle>Conflict Checker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check for calendar conflicts before scheduling classes
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conflict-start">Start Time</Label>
                <Input
                  id="conflict-start"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conflict-end">End Time</Label>
                <Input
                  id="conflict-end"
                  type="datetime-local"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                const startInput = document.getElementById('conflict-start') as HTMLInputElement;
                const endInput = document.getElementById('conflict-end') as HTMLInputElement;
                
                if (startInput.value && endInput.value) {
                  checkConflicts.mutate({
                    organizationId,
                    startTime: startInput.value,
                    endTime: endInput.value,
                  });
                }
              }}
              disabled={checkConflicts.isPending}
              className="w-full"
            >
              <Clock className="h-4 w-4 mr-2" />
              {checkConflicts.isPending ? 'Checking...' : 'Check for Conflicts'}
            </Button>
            
            {checkConflicts.data && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {checkConflicts.data.conflict_count === 0 
                    ? 'No conflicts found - time slot is available!'
                    : `Found ${checkConflicts.data.conflict_count} conflict(s). Check your connected calendars.`
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarIntegrations;