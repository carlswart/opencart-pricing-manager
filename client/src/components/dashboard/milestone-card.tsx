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
  "award": <Award className="h-6 w-6 text-amber-500" />,
  "trophy": <Trophy className="h-6 w-6 text-amber-500" />,
  "clock": <Clock className="h-6 w-6 text-blue-500" />,
  "calendar-check": <Calendar className="h-6 w-6 text-green-500" />,
  "crown": <Crown className="h-6 w-6 text-purple-500" />,
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

  const { timeSaved, nextMilestone, achievedMilestones, formattedTimeSaved } = data || {};
  
  // Calculate progress percentage toward next milestone
  let progressPercentage = 0;
  let lastMilestoneMinutes = 0;
  
  if (nextMilestone) {
    // If there are achieved milestones, use the last one as the base
    if (achievedMilestones?.length > 0) {
      const lastMilestone = achievedMilestones[achievedMilestones.length - 1];
      lastMilestoneMinutes = lastMilestone.minutes;
    }
    
    // Calculate progress from last milestone to next
    const totalRangeMinutes = nextMilestone.minutes - lastMilestoneMinutes;
    const progressMinutes = timeSaved - lastMilestoneMinutes;
    progressPercentage = Math.round((progressMinutes / totalRangeMinutes) * 100);
  } else if (achievedMilestones?.length > 0) {
    // If all milestones are achieved
    progressPercentage = 100;
  }

  return (
    <Card>
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
            <Clock className="h-8 w-8 text-primary opacity-80" />
          </div>
          
          {/* Next milestone progress bar */}
          {nextMilestone ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">Next milestone:</div>
                <div className="text-muted-foreground">{nextMilestone.name}</div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-end text-xs text-muted-foreground">
                {progressPercentage}% complete
              </div>
            </div>
          ) : (
            <div className="text-sm text-center py-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-md">
              Congratulations! You've achieved all milestones!
            </div>
          )}
          
          {/* Last achieved milestone */}
          {achievedMilestones?.length > 0 && (
            <div className="pt-2 mt-2 border-t">
              <div className="text-sm font-medium mb-2">Last achievement:</div>
              <div className="flex items-start space-x-3">
                {iconMap[achievedMilestones[achievedMilestones.length - 1].icon] || 
                 <Award className="h-6 w-6 text-amber-500" />}
                <div>
                  <div className="font-medium text-sm">
                    {achievedMilestones[achievedMilestones.length - 1].name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {achievedMilestones[achievedMilestones.length - 1].description}
                  </div>
                  {achievedMilestones[achievedMilestones.length - 1].achieved_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Achieved on {new Date(achievedMilestones[achievedMilestones.length - 1].achieved_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}