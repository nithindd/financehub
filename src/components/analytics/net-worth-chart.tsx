"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlyFinancials } from "@/actions/analytics"

interface NetWorthChartProps {
    data: any[]
}

export function NetWorthChart({ data }: NetWorthChartProps) {
    if (data.length === 0) {
        return (
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Net Savings Growth</CardTitle>
                    <CardDescription>Monthly savings trend</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-2 h-full">
            <CardHeader>
                <CardTitle>Net Savings Growth</CardTitle>
                <CardDescription>Monthly savings accumulation</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                dy={10}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="savings"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorSavings)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
