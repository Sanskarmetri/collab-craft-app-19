import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { BookOpen, GraduationCap, Target, TrendingUp, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <GraduationCap className="h-20 w-20 text-primary" />
            <BookOpen className="h-10 w-10 text-accent absolute -bottom-2 -right-2" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Studybyself
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your AI-powered companion for UPSC & State PSC preparation with intelligent mentorship and focused study management
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8"
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/auth')}
            className="text-lg px-8"
          >
            Sign In
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16 text-left">
          <div className="p-6 rounded-lg bg-card border">
            <BookOpen className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">AI Tutors</h3>
            <p className="text-sm text-muted-foreground">
              Subject-specific AI tutors for all UPSC topics
            </p>
          </div>
          
          <div className="p-6 rounded-lg bg-card border">
            <Clock className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Focus Mode</h3>
            <p className="text-sm text-muted-foreground">
              Distraction blocking for productive study sessions
            </p>
          </div>
          
          <div className="p-6 rounded-lg bg-card border">
            <Target className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Smart Planning</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered timetable generation and tracking
            </p>
          </div>
          
          <div className="p-6 rounded-lg bg-card border">
            <TrendingUp className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track progress with detailed performance insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
