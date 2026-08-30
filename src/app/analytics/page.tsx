import { createClient } from '@/utils/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getVendorSpend, getCategorySpend, getMonthlyFinancials } from '@/actions/analytics'
import { VendorChart } from '@/components/analytics/vendor-chart'
import { CategoryChart } from '@/components/analytics/category-chart'
import { MonthlyChart } from '@/components/analytics/monthly-chart'
import { NetWorthChart } from '@/components/analytics/net-worth-chart'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/signin')
    }

    // specific date range can be added later with client components
    // for now we fetch all-time or last 12 months by default
    const [vendorData, categoryData, monthlyData] = await Promise.all([
        getVendorSpend(),
        getCategorySpend(),
        getMonthlyFinancials()
    ])

    return (
        <DashboardShell>
            <div className="space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Financial Insights</h1>
                    <p className="text-muted-foreground">
                        Visualize your spending habits and financial health over time.
                    </p>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
                        <TabsTrigger value="savings">Savings & Growth</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="col-span-4">
                                <MonthlyChart data={monthlyData} />
                            </div>
                            <div className="col-span-3">
                                <CategoryChart data={categoryData} />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                            <div className="col-span-1">
                                <VendorChart data={vendorData} />
                            </div>
                            <div className="col-span-1">
                                <NetWorthChart data={monthlyData} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="spending" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <VendorChart data={vendorData} />
                            <CategoryChart data={categoryData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="savings" className="space-y-4">
                        <NetWorthChart data={monthlyData} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    )
}
