import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useOrganizations } from "@/hooks/useProfile";
import CSVImport from "@/components/csv/CSVImport";
import { Upload } from "lucide-react";

const Import = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  const { data: organizations = [] } = useOrganizations();

  return (
    <main className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Data</h1>
          <p className="text-muted-foreground">
            Import members and class schedules from CSV files
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

      {selectedOrg ? (
        <CSVImport organizationId={selectedOrg} />
      ) : (
        <div className="text-center py-12">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Select an organization</h2>
          <p className="text-muted-foreground">
            Choose an organization to import members and classes.
          </p>
        </div>
      )}
    </main>
  );
};

export default Import;