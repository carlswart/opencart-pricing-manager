import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  footer?: React.ReactNode;
  className?: string;
  tooltip?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor = "bg-primary",
  iconColor = "text-primary",
  footer,
  className,
  tooltip,
}: StatsCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-muted-foreground">{title}</p>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <h3 className="text-2xl font-semibold mt-1 text-card-foreground">{value}</h3>
          </div>
          <div className={cn("w-10 h-10 rounded-full bg-opacity-10 flex items-center justify-center", iconBgColor, iconColor)}>
            {icon}
          </div>
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </CardContent>
    </Card>
  );
}
