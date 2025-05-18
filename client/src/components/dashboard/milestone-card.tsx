import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Clock, Calendar, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  "award": <Award className="h-6 w-6 text-primary" />,
  "trophy": <Trophy className="h-6 w-6 text-primary" />,
  "clock": <Clock className="h-6 w-6 text-primary" />,
  "calendar-check": <Calendar className="h-6 w-6 text-primary" />,
  "crown": <Crown className="h-6 w-6 text-primary" />,
};

export function MilestoneCard() {
  interface MilestoneResponse {
    timeSaved: number;
    achievedMilestones: Milestone[];
    nextMilestone: Milestone | null;
    formattedTimeSaved: string;
  }

  const { data, isLoading, error } = useQuery<MilestoneResponse>({
    queryKey: ["/api/milestones"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Milestone Progress</CardTitle>
          <CardDescription>Track your efficiency achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Milestone Progress</CardTitle>
          <CardDescription>Track your efficiency achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Unable to load milestone data
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get data with default values to handle typing properly
  const achievedMilestones = data?.achievedMilestones || [];
  const nextMilestone = data?.nextMilestone || null;
  const timeSaved = data?.timeSaved || 0;
  const formattedTimeSaved = data?.formattedTimeSaved || "0 min";
  
  // Calculate progress percentage toward next milestone
  let progressPercentage = 0;
  
  if (nextMilestone) {
    // Calculate progress from 0 to next milestone
    const totalMinutes = nextMilestone.minutes;
    progressPercentage = Math.min(100, Math.round((timeSaved / totalMinutes) * 100));
  } else if (achievedMilestones.length > 0) {
    // If all milestones are achieved
    progressPercentage = 100;
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Milestone Progress</CardTitle>
        <CardDescription>Track your efficiency achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current time saved display */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{formattedTimeSaved}</div>
              <div className="text-sm text-muted-foreground">Time saved through automation</div>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </div>
          
          {/* Next milestone progress bar */}
          {nextMilestone ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">Next milestone:</div>
                <div className="text-muted-foreground">{nextMilestone.name}</div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 min</span>
                <span>{Math.round(progressPercentage)}% complete</span>
                <span>{nextMilestone.minutes} minutes</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-center py-2 bg-primary/5 text-primary rounded-md">
              Congratulations! You've achieved all milestones!
            </div>
          )}
          
          {/* Last achieved milestone */}
          {achievedMilestones.length > 0 && (
            <div className="pt-2 mt-2 border-t border-border/40">
              <div className="text-sm font-medium mb-2">Last achievement:</div>
              {(() => {
                const lastMilestone = achievedMilestones[achievedMilestones.length - 1];
                return (
                  <div className="flex items-start space-x-3">
                    {iconMap[lastMilestone.icon] || 
                     <Award className="h-6 w-6 text-primary" />}
                    <div>
                      <div className="font-medium text-sm">
                        {lastMilestone.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lastMilestone.description}
                      </div>
                      {lastMilestone.achieved_at && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Achieved on {new Date(lastMilestone.achieved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}