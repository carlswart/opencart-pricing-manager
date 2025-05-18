import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Star,
  Award,
  Clock,
  Calendar,
  Crown,
  Medal,
  Gem,
  Diamond,
  Hourglass,
  ClipboardCheck,
  CalendarCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Milestone {
  id: number;
  minutes: number;
  name: string;
  description: string;
  icon: string;
  achieved: boolean;
  achieved_at?: string;
}

// Map of icon names to Lucide components
const iconMap: Record<string, React.ReactNode> = {
  "award": <Award className="h-10 w-10 text-primary" />,
  "trophy": <Trophy className="h-10 w-10 text-primary" />,
  "clock": <Clock className="h-10 w-10 text-primary" />,
  "calendar-check": <CalendarCheck className="h-10 w-10 text-primary" />,
  "calendar": <Calendar className="h-10 w-10 text-primary" />,
  "crown": <Crown className="h-10 w-10 text-primary" />,
  "medal": <Medal className="h-10 w-10 text-primary" />,
  "gem": <Gem className="h-10 w-10 text-primary" />,
  "diamond": <Diamond className="h-10 w-10 text-primary" />,
  "hourglass": <Hourglass className="h-10 w-10 text-primary" />,
  "clipboard-check": <ClipboardCheck className="h-10 w-10 text-primary" />,
  "star": <Star className="h-10 w-10 text-primary" />,
};

interface MilestoneResponse {
  timeSaved: number;
  achievedMilestones: Milestone[];
  nextMilestone: Milestone | null;
  formattedTimeSaved: string;
}

export default function AchievementsPage() {
  const { data, isLoading, error } = useQuery<MilestoneResponse>({
    queryKey: ["/api/milestones"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Achievements</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Achievements</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Unable to load achievement data. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data with defaults to handle typing properly
  const achievedMilestones = data?.achievedMilestones || [];
  const nextMilestone = data?.nextMilestone || null;
  const timeSaved = data?.timeSaved || 0;
  const formattedTimeSaved = data?.formattedTimeSaved || "0 min";
  
  // Get all milestones
  const allMilestones = [
    ...achievedMilestones,
    ...(nextMilestone ? [nextMilestone] : []),
  ].sort((a, b) => a.minutes - b.minutes);

  // Calculate progress percentage toward next milestone
  let progressPercentage = 0;
  let lastMilestoneMinutes = 0;
  
  if (nextMilestone) {
    // If there are achieved milestones, use the last one as the base
    if (achievedMilestones.length > 0) {
      const lastMilestone = achievedMilestones[achievedMilestones.length - 1];
      lastMilestoneMinutes = lastMilestone.minutes;
    }
    
    // Calculate progress from last milestone to next
    const totalRangeMinutes = nextMilestone.minutes - lastMilestoneMinutes;
    const progressMinutes = timeSaved - lastMilestoneMinutes;
    progressPercentage = Math.round((progressMinutes / totalRangeMinutes) * 100);
  } else if (achievedMilestones.length > 0) {
    // If all milestones are achieved
    progressPercentage = 100;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <div className="flex items-center bg-muted/50 rounded-lg px-4 py-2">
          <Trophy className="mr-2 h-5 w-5 text-primary" />
          <span className="text-lg font-medium">{formattedTimeSaved} Saved</span>
        </div>
      </div>
      
      {/* Next Milestone Progress */}
      {nextMilestone && (
        <Card className="mb-8 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle>Next Achievement</CardTitle>
            <CardDescription>Your progress toward the next milestone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              {iconMap[nextMilestone.icon] || <Trophy className="h-10 w-10 text-primary" />}
              <div>
                <div className="text-xl font-bold">{nextMilestone.name}</div>
                <div className="text-muted-foreground">{nextMilestone.description}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formattedTimeSaved}</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
                <span>{nextMilestone.minutes} minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Milestone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allMilestones.map((milestone) => (
          <Card 
            key={milestone.id} 
            className={milestone.achieved 
              ? "border-primary/30 bg-primary/5 shadow-sm" 
              : "opacity-75 bg-muted/30"
            }
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{milestone.name}</CardTitle>
                {milestone.achieved && (
                  <Badge variant="default" className="bg-primary/90 hover:bg-primary">
                    Achieved
                  </Badge>
                )}
              </div>
              <CardDescription>{milestone.minutes} minutes saved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {iconMap[milestone.icon] || <Trophy className="h-10 w-10 text-primary" />}
                <div>
                  <div className="text-sm mb-1">{milestone.description}</div>
                  {milestone.achieved_at && (
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Achieved on {new Date(milestone.achieved_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Show empty state if no milestones yet */}
        {allMilestones.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                No milestones achieved yet. Keep uploading price updates to save time and unlock achievements!
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}