import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  return (
    <main className="min-h-screen container py-10">
      <h1 className="text-3xl font-bold mb-6">Studio Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Connect Supabase to manage your class schedule.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Track punch passes and memberships here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => toast({ title: "Stripe not connected", description: "Use the Supabase integration to add Stripe secrets in edge functions." })}>
              Connect Stripe
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Dashboard;
