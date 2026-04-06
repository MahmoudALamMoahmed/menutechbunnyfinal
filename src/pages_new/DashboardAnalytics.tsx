import { useState } from "react";
import PageTransition from "@/components/PageTransition";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRestaurant, useAdminBranches } from "@/hooks/useAdminData";
import { useAnalyticsData, AnalyticsFilters } from "@/hooks/useAnalyticsData";
import { useRestaurantLimits } from "@/hooks/useSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";
import DateRangeFilter from "@/components/analytics/DateRangeFilter";
import AnalyticsKPIs from "@/components/analytics/AnalyticsKPIs";
import RevenueChart from "@/components/analytics/RevenueChart";
import OrdersChart from "@/components/analytics/OrdersChart";
import StatusDistribution from "@/components/analytics/StatusDistribution";
import PaymentMethods from "@/components/analytics/PaymentMethods";
import TopItems from "@/components/analytics/TopItems";
import AllItemsTable from "@/components/analytics/AllItemsTable";
import BranchPerformance from "@/components/analytics/BranchPerformance";
import PeakHours from "@/components/analytics/PeakHours";

export default function Analytics() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  useAuth();

  const [filters, setFilters] = useState<AnalyticsFilters>({ preset: "30days", orderSource: "dashboard" });

  // Auth Guard مُدار مركزياً عبر ProtectedRoute في App.tsx

  const { data: restaurant, isLoading: restaurantLoading } = useAdminRestaurant(username);
  const { data: limits } = useRestaurantLimits(restaurant?.id);
  const { data: branches = [] } = useAdminBranches(restaurant?.id);
  const {
    isLoading,
    kpis,
    timeSeriesData,
    statusDistribution,
    paymentMethods,
    topItems,
    allItems,
    peakHours,
    branchPerformance,
    useWeekly,
  } = useAnalyticsData(restaurant?.id, filters);

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!restaurantLoading && !restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-destructive font-semibold text-lg mb-2">لم يتم العثور على المطعم</p>
          <Button variant="outline" onClick={() => navigate('/')}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/${username}/dashboard`)}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                تقارير لوحة التحكم
              </h1>
              <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <DateRangeFilter
            filters={filters}
            onFiltersChange={(f) => setFilters({ ...f, orderSource: "dashboard" })}
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          />
        </div>

        {limits && !limits.features?.analytics ? (
          <UpgradePrompt
            feature="التقارير والتحليلات"
            description="هذه الميزة متاحة في الباقة الأساسية والاحترافية. قم بترقية باقتك لعرض التقارير والتحليلات التفصيلية."
          />
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-muted-foreground">جاري تحليل البيانات...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <AnalyticsKPIs kpis={kpis} />

            {/* Revenue + Orders Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <RevenueChart data={timeSeriesData} isWeekly={useWeekly} />
              <OrdersChart data={timeSeriesData} isWeekly={useWeekly} />
            </div>

            {/* Pie Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <StatusDistribution data={statusDistribution} />
              <PaymentMethods data={paymentMethods} />
            </div>

            {/* Top Items + Peak Hours */}
            <div className="grid lg:grid-cols-2 gap-6">
              <TopItems data={topItems} />
              <PeakHours data={peakHours} />
            </div>

            {/* Branch Performance */}
            <BranchPerformance data={branchPerformance} branches={branches.map((b) => ({ id: b.id, name: b.name }))} />

            {/* All Items */}
            <AllItemsTable data={allItems} />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
