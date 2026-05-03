import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

interface TelemetryChartProps {
  data: { time: string; health: number }[];
}

export default function TelemetryChart({ data }: TelemetryChartProps) {
  return (
    <div className="w-full h-48 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis 
            dataKey="time" 
            hide={true}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#00f3ff" 
            fontSize={10} 
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #00f3ff', fontSize: '10px' }}
            itemStyle={{ color: '#00f3ff' }}
            labelStyle={{ display: 'none' }}
          />
          <Line 
            type="monotone" 
            dataKey="health" 
            stroke="#00f3ff" 
            strokeWidth={2} 
            dot={false}
            animationDuration={500}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
