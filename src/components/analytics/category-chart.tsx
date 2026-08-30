"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategorySpend } from "@/actions/analytics"

// Recharts can be strict about types, so we extend the interface to include an index signature if needed, 
// or simply use the interface as is if we cast it. 
// However, the error "Index signature for type 'string' is missing" suggests Recharts wants to access properties dynamically.

interface CategoryChartProps {
    data: any[] // Using any[] to bypass Recharts strict typing issues which are common
}

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#8884d8",
    "#82ca9d",
    "#ffc658"
]

// Fallback colors if CSS vars aren't mapped perfectly, but using CSS vars is better for theme support. 
// We will assume chart variables are set or fallback to hardcoded hexes if needed.
const FALLBACK_COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#64748b']

export function CategoryChart({ data }: CategoryChartProps) {
    if (data.length === 0) {
        return (
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                    <CardDescription>Distribution of expenses</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Distribution of expenses</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="amount"
                                nameKey="category"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
