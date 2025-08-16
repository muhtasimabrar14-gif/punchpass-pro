import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { useClasses, useCreateBooking } from "@/hooks/useClasses";
import { toast } from "@/hooks/use-toast";

const WidgetEmbed = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const [bookingData, setBookingData] = useState<Record<string, { name: string; email: string; passType: string }>>({});
  
  const { data: classes = [] } = useClasses(orgId);
  const createBooking = useCreateBooking();

  // Filter upcoming classes only
  const upcomingClasses = classes.filter(cls => new Date(cls.start_time) > new Date());

  const handleBook = async (classId: string) => {
    const booking = bookingData[classId];
    if (!booking?.name || !booking?.email || !booking?.passType) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createBooking.mutateAsync({
        class_id: classId,
        user_name: booking.name,
        user_email: booking.email,
        pass_type: booking.passType,
      });

      toast({
        title: "Booking confirmed!",
        description: "You have successfully booked this class.",
      });

      // Clear the form
      setBookingData(prev => ({
        ...prev,
        [classId]: { name: '', email: '', passType: '' }
      }));
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateBookingData = (classId: string, field: string, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [classId]: {
        ...prev[classId],
        [field]: value
      }
    }));
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (!orgId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Invalid organization ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Book Your Class</h1>
          <p className="text-muted-foreground">Choose from our available classes and secure your spot</p>
        </div>

        {upcomingClasses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No upcoming classes</h2>
              <p className="text-muted-foreground">
                Please check back later for new class schedules.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingClasses.map((cls) => {
              const { date, time } = formatDateTime(cls.start_time);
              const bookingProgress = Math.min(((cls.booking_count || 0) / cls.capacity) * 100, 100);
              const isSoldOut = (cls.booking_count || 0) >= cls.capacity;
              const currentBooking = bookingData[cls.id] || { name: '', email: '', passType: '' };

              return (
                <Card key={cls.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-1">{cls.name}</CardTitle>
                        {cls.instructor && (
                          <p className="text-sm text-muted-foreground">with {cls.instructor}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${cls.price}</p>
                        <p className="text-xs text-muted-foreground">{cls.currency}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {cls.description && (
                      <p className="text-sm text-muted-foreground">{cls.description}</p>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{date}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{time}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{cls.booking_count || 0} / {cls.capacity} spots taken</span>
                          </div>
                          <span className="text-muted-foreground">
                            {cls.capacity - (cls.booking_count || 0)} left
                          </span>
                        </div>
                        <Progress value={bookingProgress} className="h-2" />
                      </div>
                    </div>

                    {isSoldOut ? (
                      <div className="text-center py-4">
                        <span className="text-sm px-3 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
                          Sold Out
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="grid gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${cls.id}`} className="text-sm font-medium">
                              Full Name *
                            </Label>
                            <Input
                              id={`name-${cls.id}`}
                              value={currentBooking.name}
                              onChange={(e) => updateBookingData(cls.id, 'name', e.target.value)}
                              placeholder="Enter your full name"
                              className="h-9"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`email-${cls.id}`} className="text-sm font-medium">
                              Email Address *
                            </Label>
                            <Input
                              id={`email-${cls.id}`}
                              type="email"
                              value={currentBooking.email}
                              onChange={(e) => updateBookingData(cls.id, 'email', e.target.value)}
                              placeholder="Enter your email"
                              className="h-9"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`pass-${cls.id}`} className="text-sm font-medium">
                              Pass Type *
                            </Label>
                            <Select
                              value={currentBooking.passType}
                              onValueChange={(value) => updateBookingData(cls.id, 'passType', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select pass type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="drop-in">Drop-in ($)</SelectItem>
                                <SelectItem value="class-pack">Class Pack</SelectItem>
                                <SelectItem value="monthly">Monthly Membership</SelectItem>
                                <SelectItem value="annual">Annual Membership</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleBook(cls.id)}
                          disabled={!currentBooking.name || !currentBooking.email || !currentBooking.passType || createBooking.isPending}
                          variant="hero"
                          className="w-full"
                        >
                          {createBooking.isPending ? 'Booking...' : 'Book Now'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Powered by PunchPass Pro</p>
        </div>
      </div>
    </div>
  );
};

export default WidgetEmbed;