import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Check, ArrowRight, Building2, CreditCard, Calendar, Code, Sparkles } from "lucide-react";
import { useOrganizations, useCreateOrganization } from "@/hooks/useProfile";
import { useCreateClass } from "@/hooks/useClasses";
import { useCreateMembership } from "@/hooks/useMemberships";
import { useUpdateOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { toast } from "@/hooks/use-toast";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [organizationId, setOrganizationId] = useState<string>('');
  
  const [orgData, setOrgData] = useState({
    name: '',
    description: '',
    website: '',
  });
  
  const [classData, setClassData] = useState({
    name: 'Sample Yoga Class',
    description: 'A relaxing yoga session for all levels',
    start_time: '',
    end_time: '',
    capacity: 20,
    price: 25,
    instructor: '',
  });

  const { data: organizations = [] } = useOrganizations();
  const createOrganization = useCreateOrganization();
  const createClass = useCreateClass();
  const createMembership = useCreateMembership();
  const updateSettings = useUpdateOrganizationSettings();

  const steps = [
    {
      title: 'Create Organization',
      description: 'Set up your fitness studio or business',
      icon: <Building2 className="h-6 w-6" />,
    },
    {
      title: 'Create First Class',
      description: 'Add your first class to start accepting bookings',
      icon: <Calendar className="h-6 w-6" />,
    },
    {
      title: 'Set Up Membership',
      description: 'Create membership plans for recurring customers',
      icon: <CreditCard className="h-6 w-6" />,
    },
    {
      title: 'Get Embed Code',
      description: 'Add booking widget to your website',
      icon: <Code className="h-6 w-6" />,
    },
    {
      title: 'You\'re Ready!',
      description: 'Start accepting bookings and growing your business',
      icon: <Sparkles className="h-6 w-6" />,
    },
  ];

  useEffect(() => {
    // Set default times
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    const start = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
    
    setClassData(prev => ({
      ...prev,
      start_time: start,
      end_time: end,
    }));
  }, []);

  const handleCreateOrganization = async () => {
    if (!orgData.name) {
      toast({
        title: "Organization name required",
        variant: "destructive",
      });
      return;
    }

    try {
      const org = await createOrganization.mutateAsync(orgData);
      setOrganizationId(org.id);
      setCompletedSteps(prev => [...prev, 0]);
      setCurrentStep(1);
      
      toast({ title: "Organization created!" });
    } catch (error: any) {
      toast({
        title: "Error creating organization",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateClass = async () => {
    if (!organizationId || !classData.name || !classData.start_time || !classData.end_time) {
      toast({
        title: "Missing required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createClass.mutateAsync({
        organization_id: organizationId,
        ...classData,
        currency: 'USD',
      });
      
      setCompletedSteps(prev => [...prev, 1]);
      setCurrentStep(2);
      
      toast({ title: "Class created!" });
    } catch (error: any) {
      toast({
        title: "Error creating class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateMembership = async () => {
    try {
      await createMembership.mutateAsync({
        organization_id: organizationId,
        name: '10-Class Pack',
        description: 'Perfect for regular attendees - 10 classes with 3 months validity',
        type: 'class_pack',
        price: 200,
        currency: 'USD',
        class_credits: 10,
        duration_days: 90,
        is_recurring: false,
      });
      
      setCompletedSteps(prev => [...prev, 2]);
      setCurrentStep(3);
      
      toast({ title: "Membership created!" });
    } catch (error: any) {
      toast({
        title: "Error creating membership",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGetEmbedCode = () => {
    setCompletedSteps(prev => [...prev, 3]);
    setCurrentStep(4);
  };

  const handleFinish = () => {
    setCompletedSteps(prev => [...prev, 4]);
    toast({
      title: "Onboarding Complete!",
      description: "You're all set up and ready to start accepting bookings.",
    });
    onComplete();
  };

  const embedCode = `<iframe 
  src="${window.location.origin}/embed/${organizationId}"
  width="100%"
  height="800"
  frameborder="0">
</iframe>`;

  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to PunchPass Pro</h1>
        <p className="text-muted-foreground">Let's get you set up in less than 10 minutes</p>
      </div>

      <div className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            {completedSteps.includes(currentStep) ? (
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {steps[currentStep]?.icon}
              </div>
            )}
            <div>
              <h2 className="text-xl">{steps[currentStep]?.title}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                {steps[currentStep]?.description}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Studio/Business Name *</Label>
                <Input
                  id="org-name"
                  value={orgData.name}
                  onChange={(e) => setOrgData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Fitness Studio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-description">Description</Label>
                <Textarea
                  id="org-description"
                  value={orgData.description}
                  onChange={(e) => setOrgData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A welcoming space for fitness and wellness..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-website">Website</Label>
                <Input
                  id="org-website"
                  value={orgData.website}
                  onChange={(e) => setOrgData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://mystudio.com"
                />
              </div>
              <Button onClick={handleCreateOrganization} className="w-full">
                <ArrowRight className="h-4 w-4 ml-2" />
                Create Organization
              </Button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name *</Label>
                <Input
                  id="class-name"
                  value={classData.name}
                  onChange={(e) => setClassData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-description">Description</Label>
                <Textarea
                  id="class-description"
                  value={classData.description}
                  onChange={(e) => setClassData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time *</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={classData.start_time}
                    onChange={(e) => setClassData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time *</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={classData.end_time}
                    onChange={(e) => setClassData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={classData.capacity}
                    onChange={(e) => setClassData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 20 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={classData.price}
                    onChange={(e) => setClassData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <Button onClick={handleCreateClass} className="w-full">
                <ArrowRight className="h-4 w-4 ml-2" />
                Create Class
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Creating Default Membership:</h3>
                <ul className="text-sm space-y-1">
                  <li>• 10-Class Pack</li>
                  <li>• $200 (Valid for 3 months)</li>
                  <li>• Perfect for regular customers</li>
                </ul>
              </div>
              <Button onClick={handleCreateMembership} className="w-full">
                <ArrowRight className="h-4 w-4 ml-2" />
                Create Membership Plan
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Embed Code for Your Website:</h3>
                <pre className="text-xs bg-background p-3 rounded border overflow-auto">
                  {embedCode}
                </pre>
                <p className="text-sm text-muted-foreground mt-2">
                  Copy this code and paste it into your website where you want the booking widget to appear.
                </p>
              </div>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(embedCode);
                  toast({ title: "Copied to clipboard!" });
                }}
                variant="outline"
                className="w-full"
              >
                Copy Embed Code
              </Button>
              <Button onClick={handleGetEmbedCode} className="w-full">
                <ArrowRight className="h-4 w-4 ml-2" />
                Continue
              </Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Congratulations!</h3>
                  <p className="text-muted-foreground">
                    Your studio is now ready to accept bookings. Here's what you can do next:
                  </p>
                </div>
              </div>
              
              <div className="grid gap-4 text-left">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">📅 Add more classes</h4>
                  <p className="text-sm text-muted-foreground">Create your full schedule</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">💳 Connect Stripe</h4>
                  <p className="text-sm text-muted-foreground">Start accepting payments</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">📱 Test your booking widget</h4>
                  <p className="text-sm text-muted-foreground">Visit /embed/{organizationId}</p>
                </div>
              </div>
              
              <Button onClick={handleFinish} size="lg" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Managing Your Studio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingWizard;