import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Calendar, Mail } from "lucide-react";
import { useOrganizations } from "@/hooks/useProfile";
import { useClasses, useClassBookings } from "@/hooks/useClasses";

const Members = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: organizations = [] } = useOrganizations();
  const { data: classes = [] } = useClasses(selectedOrg);

  // Get all bookings for the selected organization
  const allBookings = classes.flatMap(cls => {
    const { data: bookings = [] } = useClassBookings(cls.id);
    return bookings.map(booking => ({
      ...booking,
      class_name: cls.name,
      class_date: cls.start_time,
    }));
  });

  // Get unique members from bookings
  const uniqueMembers = allBookings.reduce((members, booking) => {
    const key = booking.user_email;
    if (!members[key]) {
      members[key] = {
        name: booking.user_name,
        email: booking.user_email,
        bookings: [],
        total_bookings: 0,
        last_booking: null,
      };
    }
    
    members[key].bookings.push(booking);
    members[key].total_bookings += 1;
    
    if (!members[key].last_booking || new Date(booking.created_at) > new Date(members[key].last_booking)) {
      members[key].last_booking = booking.created_at;
    }
    
    return members;
  }, {} as Record<string, any>);

  const membersList = Object.values(uniqueMembers);

  // Filter members based on search term
  const filteredMembers = membersList.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <main className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Members</h1>
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
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{membersList.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allBookings.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Bookings per Member</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {membersList.length > 0 
                    ? Math.round((allBookings.length / membersList.length) * 10) / 10 
                    : 0
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {searchTerm ? 'No members found' : 'No members yet'}
              </h2>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'Members will appear here when they book classes.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredMembers.map((member, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{member.total_bookings} bookings</span>
                          </div>
                          {member.last_booking && (
                            <div>
                              <span className="text-muted-foreground">Last booking: </span>
                              <span>{formatDate(member.last_booking)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <Badge variant="secondary">
                          {member.total_bookings === 1 ? 'New Member' : 'Regular'}
                        </Badge>
                      </div>
                    </div>

                    {/* Recent Bookings */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Recent Bookings</h4>
                      <div className="space-y-1">
                        {member.bookings
                          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 3)
                          .map((booking: any, bookingIndex: number) => (
                            <div key={bookingIndex} className="flex items-center justify-between text-sm">
                              <span>{booking.class_name}</span>
                              <span className="text-muted-foreground">{formatDate(booking.class_date)}</span>
                            </div>
                          ))}
                        {member.bookings.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{member.bookings.length - 3} more bookings
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Select an organization</h2>
          <p className="text-muted-foreground">
            Choose an organization to view its members and bookings.
          </p>
        </div>
      )}
    </main>
  );
};

export default Members;