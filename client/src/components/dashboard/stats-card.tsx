import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor = "bg-primary",
  iconColor = "text-primary",
  footer,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
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
