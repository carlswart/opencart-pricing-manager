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
  "award": <Award className="h-10 w-10 text-amber-500" />,
  "trophy": <Trophy className="h-10 w-10 text-amber-500" />,
  "clock": <Clock className="h-10 w-10 text-blue-500" />,
  "calendar-check": <CalendarCheck className="h-10 w-10 text-green-500" />,
  "calendar": <Calendar className="h-10 w-10 text-green-500" />,
  "crown": <Crown className="h-10 w-10 text-purple-500" />,
  "medal": <Medal className="h-10 w-10 text-yellow-500" />,
  "gem": <Gem className="h-10 w-10 text-pink-500" />,
  "diamond": <Diamond className="h-10 w-10 text-cyan-500" />,
  "hourglass": <Hourglass className="h-10 w-10 text-indigo-500" />,
  "clipboard-check": <ClipboardCheck className="h-10 w-10 text-teal-500" />,
  "star": <Star className="h-10 w-10 text-yellow-400" />,
};

export default function AchievementsPage() {
  const { data, isLoading, error } = useQuery({
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

  const { timeSaved, achievedMilestones = [], nextMilestone, formattedTimeSaved } = data || {};
  
  // Get all milestones
  const allMilestones = [
    ...(achievedMilestones || []),
    ...(nextMilestone ? [nextMilestone] : []),
  ].sort((a, b) => a.minutes - b.minutes);

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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Achievements</h1>
        <div className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          <span className="text-lg font-medium">{formattedTimeSaved} Saved</span>
        </div>
      </div>
      
      {/* Next Milestone Progress */}
      {nextMilestone && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Next Achievement</CardTitle>
            <CardDescription>Your progress toward the next milestone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              {iconMap[nextMilestone.icon] || <Trophy className="h-10 w-10 text-yellow-500" />}
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
          <Card key={milestone.id} className={milestone.achieved ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "opacity-70"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{milestone.name}</CardTitle>
                {milestone.achieved && (
                  <Badge variant="outline" className="bg-green-500 bg-opacity-10 border border-green-500 text-green-600 dark:text-green-400">
                    Achieved
                  </Badge>
                )}
              </div>
              <CardDescription>{milestone.minutes} minutes saved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {iconMap[milestone.icon] || <Trophy className="h-10 w-10 text-yellow-500" />}
                <div>
                  <div className="text-sm mb-1">{milestone.description}</div>
                  {milestone.achieved_at && (
                    <div className="text-xs text-muted-foreground">
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