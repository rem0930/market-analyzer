/**
 * @layer features
 * @segment demographic-analysis
 * @what 年齢構成の円グラフ
 */

'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AgeDistribution } from '@/entities/trade-area';

interface AgeDistributionChartProps {
  ageDistribution: AgeDistribution[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AgeDistributionChart({ ageDistribution }: AgeDistributionChartProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Age Distribution</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={ageDistribution}
            dataKey="percentage"
            nameKey="range"
            cx="50%"
            cy="50%"
            outerRadius={75}
            label={({ range, percentage }) => `${range}: ${percentage.toFixed(1)}%`}
            labelLine={false}
          >
            {ageDistribution.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Share']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
