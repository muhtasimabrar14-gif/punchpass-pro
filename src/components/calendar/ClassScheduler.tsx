import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { useCalendarEvents, useCheckCalendarConflicts } from "@/hooks/useCalendarIntegrations";
import { useCreateClass } from "@/hooks/useClasses";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ClassSchedulerProps {
  organizationId: string;
  onClassCreated?: () => void;
}

const ClassScheduler = ({ organizationId, onClassCreated }: ClassSchedulerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    capacity: 20,
    instructor: '',
    price: 25,
  });
  const [conflicts, setConflicts] = useState<any>(null);

  const { data: calendarEvents = [] } = useCalendarEvents(organizationId);
  const checkConflicts = useCheckCalendarConflicts();
  const createClass = useCreateClass();

  // Get busy dates from calendar events
  const busyDates = calendarEvents.map(event => new Date(event.start_time));

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setFormData(prev => ({
        ...prev,
        start_time: `${dateStr}T09:00`,
        end_time: `${dateStr}T10:00`,
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      checkConflicts.mutate({
        organizationId,
        startTime: formData.start_time,
        endTime: formData.end_time,
      });
    }
  }, [formData.start_time, formData.end_time, organizationId]);

  useEffect(() => {
    if (checkConflicts.data) {
      setConflicts(checkConflicts.data);
    }
  }, [checkConflicts.data]);

  const handleCreateClass = async () => {
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (conflicts?.conflict_count > 0) {
      toast({
        title: "Calendar conflicts detected",
        description: "Please resolve conflicts before creating the class.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createClass.mutateAsync({
        organization_id: organizationId,
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
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        start_time: selectedDate ? `${format(selectedDate, 'yyyy-MM-dd')}T09:00` : '',
        end_time: selectedDate ? `${format(selectedDate, 'yyyy-MM-dd')}T10:00` : '',
        capacity: 20,
        instructor: '',
        price: 25,
      });

      onClassCreated?.();
    } catch (error: any) {
      toast({
        title: "Error creating class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calendar Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Select Date</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            modifiers={{
              busy: busyDates,
            }}
            modifiersStyles={{
              busy: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
            }}
            className="rounded-md border"
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-destructive rounded"></div>
              <span>Busy times from connected calendars</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span>Available for scheduling</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Schedule Class</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              placeholder="A relaxing yoga session for all levels..."
              rows={3}
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

          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                placeholder="Instructor name"
              />
            </div>
          </div>

          {/* Conflict Warning */}
          {conflicts && (
            <Alert variant={conflicts.conflict_count > 0 ? "destructive" : "default"}>
              {conflicts.conflict_count > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {conflicts.conflict_count === 0 
                  ? 'No calendar conflicts detected - time slot is available!'
                  : `${conflicts.conflict_count} conflict(s) detected with connected calendars`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Show conflicts if any */}
          {conflicts?.conflicts && conflicts.conflicts.length > 0 && (
            <div className="space-y-2">
              <Label>Conflicts:</Label>
              {conflicts.conflicts.map((conflict: any, index: number) => (
                <div key={index} className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                  <div className="font-medium">{conflict.title}</div>
                  <div className="text-muted-foreground">
                    {new Date(conflict.start_time).toLocaleString()} - {new Date(conflict.end_time).toLocaleString()}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {conflict.provider}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <Button 
            onClick={handleCreateClass} 
            disabled={
              !formData.name || 
              !formData.start_time || 
              !formData.end_time || 
              createClass.isPending ||
              (conflicts?.conflict_count > 0)
            }
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {createClass.isPending ? 'Creating...' : 'Create Class'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassScheduler;