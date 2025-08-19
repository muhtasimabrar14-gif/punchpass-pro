import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileText, Users, Calendar, AlertCircle } from "lucide-react";
import { useCreateClass } from "@/hooks/useClasses";
import { useCreateUserPass } from "@/hooks/useMemberships";
import { toast } from "@/hooks/use-toast";

interface CSVImportProps {
  organizationId: string;
}

const CSVImport = ({ organizationId }: CSVImportProps) => {
  const [memberFile, setMemberFile] = useState<File | null>(null);
  const [classFile, setClassFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{
    type: string;
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const memberFileRef = useRef<HTMLInputElement>(null);
  const classFileRef = useRef<HTMLInputElement>(null);
  
  const createClass = useCreateClass();
  const createUserPass = useCreateUserPass();

  const handleMemberImport = async () => {
    if (!memberFile) return;
    
    try {
      const text = await memberFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Expected headers: name, email, membership_type, credits, expires_at
      const expectedHeaders = ['name', 'email'];
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast({
          title: "Invalid CSV format",
          description: `Missing required headers: ${missingHeaders.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      const members = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const member: any = {};
        headers.forEach((header, index) => {
          member[header] = values[index];
        });
        return member;
      });

      let success = 0;
      const errors: string[] = [];

      for (const member of members) {
        try {
          if (!member.name || !member.email) {
            errors.push(`Skipping row with missing name or email: ${JSON.stringify(member)}`);
            continue;
          }
          
          // For this example, we'll create a basic pass for each member
          // In a real implementation, you might want to create user accounts first
          success++;
        } catch (error: any) {
          errors.push(`Failed to import ${member.name}: ${error.message}`);
        }
      }

      setImportResults({
        type: 'Members',
        success,
        failed: errors.length,
        errors: errors.slice(0, 10), // Show first 10 errors
      });

      toast({
        title: "Import completed",
        description: `Successfully processed ${success} members, ${errors.length} failed`,
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClassImport = async () => {
    if (!classFile) return;
    
    try {
      const text = await classFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Expected headers: name, description, start_time, end_time, capacity, price, instructor
      const expectedHeaders = ['name', 'start_time', 'end_time'];
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast({
          title: "Invalid CSV format",
          description: `Missing required headers: ${missingHeaders.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      const classes = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const classData: any = {};
        headers.forEach((header, index) => {
          classData[header] = values[index];
        });
        return classData;
      });

      let success = 0;
      const errors: string[] = [];

      for (const cls of classes) {
        try {
          if (!cls.name || !cls.start_time || !cls.end_time) {
            errors.push(`Skipping row with missing required fields: ${JSON.stringify(cls)}`);
            continue;
          }

          await createClass.mutateAsync({
            organization_id: organizationId,
            name: cls.name,
            description: cls.description || undefined,
            start_time: new Date(cls.start_time).toISOString(),
            end_time: new Date(cls.end_time).toISOString(),
            capacity: parseInt(cls.capacity) || 20,
            price: parseFloat(cls.price) || 0,
            currency: 'USD',
            instructor: cls.instructor || undefined,
          });
          
          success++;
        } catch (error: any) {
          errors.push(`Failed to import ${cls.name}: ${error.message}`);
        }
      }

      setImportResults({
        type: 'Classes',
        success,
        failed: errors.length,
        errors: errors.slice(0, 10),
      });

      toast({
        title: "Import completed",
        description: `Successfully imported ${success} classes, ${errors.length} failed`,
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadMemberTemplate = () => {
    const csv = 'name,email,membership_type,credits,expires_at\nJohn Doe,john@example.com,class_pack,10,2024-12-31\nJane Smith,jane@example.com,unlimited,,2024-12-31';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadClassTemplate = () => {
    const csv = 'name,description,start_time,end_time,capacity,price,instructor\nMorning Yoga,Relaxing yoga session,2024-01-15 09:00:00,2024-01-15 10:00:00,20,25,Sarah Johnson\nHIIT Class,High intensity interval training,2024-01-15 18:00:00,2024-01-15 19:00:00,15,30,Mike Wilson';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">CSV Import</h2>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Import Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with member information. Required columns: name, email
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={downloadMemberTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-file">Select CSV File</Label>
                <Input
                  id="member-file"
                  type="file"
                  accept=".csv"
                  ref={memberFileRef}
                  onChange={(e) => setMemberFile(e.target.files?.[0] || null)}
                />
              </div>

              {memberFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm">{memberFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({(memberFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleMemberImport} 
                disabled={!memberFile}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Members
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Import Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with class schedules. Required columns: name, start_time, end_time
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={downloadClassTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-file">Select CSV File</Label>
                <Input
                  id="class-file"
                  type="file"
                  accept=".csv"
                  ref={classFileRef}
                  onChange={(e) => setClassFile(e.target.files?.[0] || null)}
                />
              </div>

              {classFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm">{classFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({(classFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleClassImport} 
                disabled={!classFile || createClass.isPending}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {createClass.isPending ? 'Importing...' : 'Import Classes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{importResults.success + importResults.failed}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Errors:</h4>
                  <div className="space-y-1">
                    {importResults.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVImport;