import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

const sampleClasses = [
  { id: "yoga-am", name: "Morning Flow Yoga", date: "Today 9:00 AM", capacity: 18, booked: 14 },
  { id: "hiit-pm", name: "HIIT Express", date: "Today 6:00 PM", capacity: 20, booked: 20 },
  { id: "pilates", name: "Pilates Fundamentals", date: "Tomorrow 7:30 AM", capacity: 12, booked: 7 },
];

const WidgetEmbed = () => {
  const { orgId } = useParams();

  const handleBook = (classId: string) => {
    toast({
      title: "Booking requires backend",
      description: "Connect Supabase + Stripe to enable real bookings and payments.",
    });
    console.log("Requested booking for", { orgId, classId });
  };

  return (
    <main className="p-4 md:p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Book a Class {orgId ? `– ${orgId}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {sampleClasses.map((c) => {
              const percent = Math.min(100, Math.round((c.booked / c.capacity) * 100));
              const soldOut = c.booked >= c.capacity;
              return (
                <div key={c.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-muted-foreground">{c.date}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{c.booked}/{c.capacity}</div>
                  </div>
                  <Progress value={percent} />
                  <div className="mt-4 grid sm:grid-cols-3 gap-3 items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${c.id}`}>Your name</Label>
                      <Input id={`name-${c.id}`} placeholder="Alex Johnson" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`email-${c.id}`}>Email</Label>
                      <Input id={`email-${c.id}`} type="email" placeholder="alex@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Pass type</Label>
                      <Select defaultValue="punch">
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="punch">Punch Pass</SelectItem>
                          <SelectItem value="member">Membership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button disabled={soldOut} onClick={() => handleBook(c.id)}>
                      {soldOut ? "Sold out" : "Book now"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default WidgetEmbed;
