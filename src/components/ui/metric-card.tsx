import React from 'react';
import { Card } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  period?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

export function MetricCard({
  label,
  value,
  description,
  period = 'All-time',
  icon,
  trend,
}: MetricCardProps) {
  return (
    <Card className="p-5 flex flex-col justify-between hover:border-zinc-300/80 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-zinc-600">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">
          {value}
        </div>
        
        <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
          <span>{description || `Period: ${period}`}</span>
          {trend && (
            <span
              className={`font-medium ${
                trend.positive ? 'text-emerald-600' : 'text-zinc-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
