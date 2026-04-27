import { useState, useMemo, useEffect } from "react";
import PageTransition from "@/components/PageTransition";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Clock, Volume2, VolumeX, MessageCircle } from "lucide-react";
import { useAdminRestaurant, useAdminOrders, usePendingOrdersCount } from "@/hooks/useAdminData";
import { useUpdateOrderStatus } from "@/hooks/admin-mutations/useOrderMutations";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantLimits } from "@/hooks/useSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";
import OrderCard from "@/components/OrderCard";
import OrderFilters from "@/components/OrderFilters";
import OrderStats from "@/components/OrderStats";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { Switch } from "@/components/ui/switch";
import PaginationControls from "@/components/super-admin/PaginationControls";

export default function WhatsAppOrders() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: restaurant, isLoading: restaurantLoading } = useAdminRestaurant(username);
  const { data: limits } = useRestaurantLimits(restaurant?.id);
  const { data: ordersResult, isLoading: ordersLoading } = useAdminOrders(restaurant?.id, "whatsapp", page, pageSize);
  const updateStatusMut = useUpdateOrderStatus(restaurant?.id);

  const orders = ordersResult?.data ?? [];
  const totalCount = ordersResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const { data: pendingCount = 0 } = usePendingOrdersCount('restaurant_id', restaurant?.id, 'whatsapp');

  useOrdersRealtime({
    filterColumn: "restaurant_id",
    filterValue: restaurant?.id,
    queryKey: ["admin_orders", restaurant?.id, "whatsapp"],
  });

  useEffect(() => { setPage(1); }, [searchQuery, timeFilter, statusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !order.id.toLowerCase().includes(q) &&
          !order.customer_name.toLowerCase().includes(q) &&
          !order.customer_phone.includes(q)
        )
          return false;
      }
      if (timeFilter !== null) {
        if (new Date(order.created_at).getTime() < Date.now() - timeFilter * 3600000) return false;
      }
      if (statusFilter && order.status !== statusFilter) return false;
      return true;
    });
  }, [orders, searchQuery, timeFilter, statusFilter]);

  const { soundEnabled, toggleSound } = useNotificationSound();

  const handleUpdateStatus = (orderId: string, newStatus: string, isConfirmed?: boolean) => {
    updateStatusMut.mutate({ orderId, status: newStatus, isConfirmed });
  };

  const hasWhatsappOrders = !limits || limits.features?.dashboard_orders;

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  if (restaurantLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
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
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="w-7 h-7 text-green-600" />
                طلبات واتساب
              </h1>
              <p className="text-muted-foreground">طلبات {restaurant?.name} عبر واتساب</p>
            </div>
          </div>
        </div>

        {!hasWhatsappOrders ? (
          <UpgradePrompt
            feature="طلبات واتساب"
            description="هذه الميزة متاحة في الباقات المدفوعة. قم بترقية باقتك لاستقبال وإدارة طلبات واتساب."
          />
        ) : (
          <>
            <Card className={`mb-6 border-2 ${pendingCount > 0 ? "border-green-400 bg-green-50" : "border-muted"}`}>
              <CardContent className="flex items-center justify-between py-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-full ${pendingCount > 0 ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}
                  >
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <p
                      key={pendingCount}
                      className={`text-3xl font-bold ${pendingCount > 0 ? "text-green-600 animate-scale-in" : "text-muted-foreground"}`}
                    >
                      {pendingCount}
                    </p>
                    <p className="text-sm text-muted-foreground">طلبات واتساب جديدة بانتظار المراجعة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  )}
                  <Switch checked={soundEnabled} onCheckedChange={toggleSound} />
                </div>
              </CardContent>
            </Card>

            <OrderStats orders={orders} />

            <OrderFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              totalCount={totalCount}
              filteredCount={filteredOrders.length}
            />

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد طلبات واتساب</h3>
                    <p className="text-muted-foreground text-center">
                      {totalCount > 0
                        ? "لا توجد طلبات تطابق الفلاتر المحددة"
                        : "لم يتم استلام أي طلبات واتساب حتى الآن"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {filteredOrders.map((order: any) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={handleUpdateStatus}
                      isUpdating={updateStatusMut.isPending}
                    />
                  ))}
                  <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
