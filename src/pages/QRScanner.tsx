import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useOrganizations } from "@/hooks/useProfile";
import { useClasses } from "@/hooks/useClasses";
import QRCheckIn from "@/components/qr/QRCheckIn";
import { QrCode } from "lucide-react";

const QRScanner = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  const { data: organizations = [] } = useOrganizations();
  const { data: classes = [] } = useClasses(selectedOrg);

  const todaysClasses = classes.filter(cls => {
    const classDate = new Date(cls.start_time);
    const today = new Date();
    return classDate.toDateString() === today.toDateString();
  });

  const currentClass = classes.find(cls => cls.id === selectedClass);

  return (
    <main className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Check-In</h1>
          <p className="text-muted-foreground">
            Scan QR codes to check students into classes
          </p>
        </div>
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

      {selectedOrg && (
        <div className="space-y-4">
          <Label>Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose a class for today" />
            </SelectTrigger>
            <SelectContent>
              {todaysClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {new Date(cls.start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedClass && currentClass ? (
        <QRCheckIn classId={selectedClass} className={currentClass.name} />
      ) : selectedOrg ? (
        <div className="text-center py-12">
          <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Select a class</h2>
          <p className="text-muted-foreground">
            {todaysClasses.length === 0 
              ? 'No classes scheduled for today'
              : 'Choose a class to start checking in students'
            }
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Select an organization</h2>
          <p className="text-muted-foreground">
            Choose an organization to view today's classes for check-in.
          </p>
        </div>
      )}
    </main>
  );
};

export default QRScanner;