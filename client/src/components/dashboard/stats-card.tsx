import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const statCardVariants = cva(
  "bg-white p-6 rounded-lg shadow-sm border border-gray-200",
  {
    variants: {
      color: {
        blue: "text-primary-600",
        green: "text-emerald-600",
        orange: "text-orange-600",
        purple: "text-purple-600",
      },
    },
    defaultVariants: {
      color: "blue",
    },
  }
);

const iconContainerVariants = cva(
  "p-3 rounded-full",
  {
    variants: {
      color: {
        blue: "bg-primary-100 text-primary-600",
        green: "bg-emerald-100 text-emerald-600",
        orange: "bg-orange-100 text-orange-600",
        purple: "bg-purple-100 text-purple-600",
      },
    },
    defaultVariants: {
      color: "blue",
    },
  }
);

interface StatsCardProps extends VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = "vs. semana anterior",
  color,
  className,
}: StatsCardProps) {
  const isTrendPositive = trend !== undefined && trend > 0;
  const isTrendNegative = trend !== undefined && trend < 0;
  
  return (
    <div className={cn(statCardVariants({ color }), className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="font-bold text-2xl text-gray-800">{value}</p>
        </div>
        <div className={iconContainerVariants({ color })}>
          <Icon className="text-xl" size={20} />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-2 flex items-center text-sm">
          <span 
            className={cn(
              "flex items-center",
              isTrendPositive && "text-green-500",
              isTrendNegative && "text-red-500"
            )}
          >
            {isTrendPositive && '↑'} 
            {isTrendNegative && '↓'}
            {Math.abs(trend)}%
          </span>
          <span className="text-gray-400 ml-2">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
