import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Users, DollarSign, Clock } from "lucide-react";
import { useOrganizations } from "@/hooks/useProfile";
import { useClasses, useCreateClass, Class } from "@/hooks/useClasses";
import { useCalendarEvents } from "@/hooks/useCalendarIntegrations";
import ClassScheduler from "@/components/calendar/ClassScheduler";
import { toast } from "@/hooks/use-toast";

const Classes = () => {
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    capacity: 20,
    instructor: '',
    price: 25,
  });

  const { data: organizations = [] } = useOrganizations();
  const { data: classes = [] } = useClasses(selectedOrg);
  const { data: calendarEvents = [] } = useCalendarEvents(selectedOrg);
  const createClass = useCreateClass();

  const handleCreateClass = async () => {
    if (!selectedOrg || !formData.name || !formData.start_time || !formData.end_time) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createClass.mutateAsync({
        organization_id: selectedOrg,
        name: formData.name,
        description: formData.description || undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
        capacity: formData.capacity,
        instructor: formData.instructor || undefined,
        price: formData.price,
        currency: 'USD',
      });

      toast({ title: "Class created successfully!" });
      setIsCreatingClass(false);
      setFormData({
        name: '',
        description: '',
        start_time: '',
        end_time: '',
        capacity: 20,
        instructor: '',
        price: 25,
      });
    } catch (error: any) {
      toast({
        title: "Error creating class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  return (
    <main className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Classes</h1>
        
        <Dialog open={isCreatingClass} onOpenChange={setIsCreatingClass}>
          <DialogTrigger asChild>
            <Button variant="hero" disabled={!selectedOrg}>
              <Plus className="h-4 w-4 mr-2" />
              New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name *</Label>
                <Input
                  id="class-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Morning Yoga"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="class-description">Description</Label>
                <Textarea
                  id="class-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A relaxing yoga session..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time *</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time *</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 20 }))}
                  />
                </div>
                
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                  placeholder="Instructor name"
                />
              </div>
              
              <Button onClick={handleCreateClass} className="w-full">
                Create Class
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization Selector */}
      <div className="space-y-4">
        <Label>Select Organization</Label>
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="max-w-md">
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

      {selectedOrg ? (
        classes.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No classes yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first class to start accepting bookings.
            </p>
            <Button variant="hero" onClick={() => setIsCreatingClass(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls: Class) => (
              <Card key={cls.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <div className="text-right">
                      <p className="font-semibold text-lg">${cls.price}</p>
                    </div>
                  </div>
                  {cls.instructor && (
                    <p className="text-sm text-muted-foreground">with {cls.instructor}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {cls.description && (
                    <p className="text-sm text-muted-foreground">{cls.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatDateTime(cls.start_time)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{cls.booking_count || 0} / {cls.capacity} booked</span>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(((cls.booking_count || 0) / cls.capacity) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      new Date(cls.start_time) > new Date() 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {new Date(cls.start_time) > new Date() ? 'Upcoming' : 'Past'}
                    </span>
                    
                    {(cls.booking_count || 0) >= cls.capacity && (
                      <span className="text-sm px-2 py-1 rounded-full bg-red-100 text-red-800">
                        Sold Out
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Select an organization</h2>
          <p className="text-muted-foreground">
            Choose an organization to view and manage its classes.
          </p>
        </div>
      )}

      {/* Class Scheduler */}
      {selectedOrg && (
        <div className="space-y-6">
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">Smart Class Scheduler</h2>
            <ClassScheduler 
              organizationId={selectedOrg} 
              onClassCreated={() => {
                // Refresh classes list
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default Classes;