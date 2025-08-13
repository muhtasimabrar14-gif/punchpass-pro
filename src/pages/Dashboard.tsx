import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Users, Building2, TrendingUp } from "lucide-react";
import { useProfile, useOrganizations, useCreateOrganization } from "@/hooks/useProfile";
import { useClasses } from "@/hooks/useClasses";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  
  const { data: profile } = useProfile();
  const { data: organizations = [] } = useOrganizations();
  const { data: classes = [] } = useClasses(selectedOrg);
  const createOrganization = useCreateOrganization();

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    
    try {
      await createOrganization.mutateAsync({
        name: orgName,
        description: orgDescription || undefined,
        website: orgWebsite || undefined,
      });
      
      toast({ title: "Organization created successfully!" });
      setIsCreatingOrg(false);
      setOrgName('');
      setOrgDescription('');
      setOrgWebsite('');
    } catch (error: any) {
      toast({
        title: "Error creating organization",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const currentOrg = organizations.find(org => org.id === selectedOrg);
  const upcomingClasses = classes.filter(cls => new Date(cls.start_time) > new Date()).slice(0, 5);
  const totalBookings = classes.reduce((sum, cls) => sum + (cls.booking_count || 0), 0);

  return (
    <main className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.display_name || 'there'}!
          </p>
        </div>
        
        <Dialog open={isCreatingOrg} onOpenChange={setIsCreatingOrg}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="h-4 w-4 mr-2" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Fitness Studio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-description">Description (optional)</Label>
                <Textarea
                  id="org-description"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="A brief description of your studio..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-website">Website (optional)</Label>
                <Input
                  id="org-website"
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  placeholder="https://mystudio.com"
                />
              </div>
              <Button onClick={handleCreateOrg} className="w-full" disabled={!orgName.trim()}>
                Create Organization
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {organizations.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No organizations yet</h2>
          <p className="text-muted-foreground mb-4">
            Create your first organization to start managing classes and bookings.
          </p>
          <Button variant="hero" onClick={() => setIsCreatingOrg(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      ) : (
        <>
          {/* Organization Selector */}
          <div className="space-y-4">
            <Label>Select Organization</Label>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <Card
                  key={org.id}
                  className={`cursor-pointer transition-colors ${
                    selectedOrg === org.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedOrg(org.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{org.name}</h3>
                    <p className="text-sm text-muted-foreground">{org.role}</p>
                    {org.description && (
                      <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedOrg && currentOrg && (
            <>
              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classes.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalBookings}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{upcomingClasses.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Capacity</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {classes.length > 0 
                        ? Math.round((totalBookings / classes.reduce((sum, cls) => sum + cls.capacity, 0)) * 100) + '%'
                        : '0%'
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Classes */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingClasses.length === 0 ? (
                    <p className="text-muted-foreground">No upcoming classes scheduled.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingClasses.map((cls) => (
                        <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{cls.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(cls.start_time).toLocaleDateString()} at{' '}
                              {new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {cls.booking_count || 0}/{cls.capacity} booked
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ${cls.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </main>
  );
};

export default Dashboard;
