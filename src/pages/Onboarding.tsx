import { useNavigate } from "react-router-dom";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

const Onboarding = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 py-10">
      <div className="container max-w-4xl">
        <OnboardingWizard onComplete={handleComplete} />
      </div>
    </main>
  );
};

export default Onboarding;