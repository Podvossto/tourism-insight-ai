import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendChartProps {
  data?: any[];
}

export function TrendChart({ data }: TrendChartProps) {
  const mockData = data || [
    { year: 2020, revenue: 5000, tourists: 3.5 },
    { year: 2021, revenue: 5500, tourists: 4.2 },
    { year: 2022, revenue: 6200, tourists: 5.8 },
    { year: 2023, revenue: 6800, tourists: 7.0 },
    { year: 2024, revenue: 7200, tourists: 7.8 },
    { year: "ธ.ค. 2025", revenue: 7650, tourists: 8.2 },
  ];

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">5-Year Revenue & Tourist Trend (เชียงใหม่)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="year" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--primary))"
              style={{ fontSize: '12px' }}
              label={{ value: 'รายได้ (ล้านบาท)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--secondary))"
              style={{ fontSize: '12px' }}
              label={{ value: 'นักท่องเที่ยว (ล้านคน)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              name="รายได้ (฿ ล้านบาท)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="tourists" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--secondary))', r: 4 }}
              strokeDasharray="5 5"
              name="นักท่องเที่ยว (ล้านคน)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
