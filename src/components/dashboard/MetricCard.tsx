import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: LucideIcon;
}

export function MetricCard({ title, value, description, trend, icon: Icon }: MetricCardProps) {
  return (
    <Card className="bg-card/60 text-card-foreground hover:border-primary/20 overflow-hidden border shadow-sm backdrop-blur-md transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="text-muted-foreground h-5 w-5" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(description || trend) && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
            <span>{description}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
export default MetricCard;
