/**
 * @layer features
 * @segment demographic-analysis
 * @what 人口統計の棒グラフ（年齢分布）
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AgeDistribution } from '@/entities/trade-area';

interface PopulationChartProps {
  ageDistribution: AgeDistribution[];
}

export function PopulationChart({ ageDistribution }: PopulationChartProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Population by Age Group</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={ageDistribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => [value.toLocaleString(), 'People']} />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
