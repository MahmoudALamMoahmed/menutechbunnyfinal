import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Building2, LogOut, Clock, Volume2, VolumeX } from 'lucide-react';
import { useBranchOrders, usePendingOrdersCount } from '@/hooks/useAdminData';
import { useUpdateOrderStatus } from '@/hooks/admin-mutations/useOrderMutations';
import { useAuth } from '@/hooks/useAuth';
import OrderCard from '@/components/OrderCard';
import OrderFilters from '@/components/OrderFilters';
import OrderStats from '@/components/OrderStats';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useRestaurantLimits } from '@/hooks/useSubscription';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaginationControls from '@/components/super-admin/PaginationControls';

export default function BranchOrders() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, loading, isBranchStaff, branchStaffInfo, userTypeLoading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: ordersResult, isLoading: ordersLoading } = useBranchOrders(
    isBranchStaff ? branchStaffInfo?.branch_id : undefined,
    activeTab,
    page,
    pageSize
  );
  const updateStatusMut = useUpdateOrderStatus(branchStaffInfo?.branch_id, true);

  const orders = ordersResult?.data ?? [];
  const totalCount = ordersResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const { data: limits } = useRestaurantLimits(branchStaffInfo?.restaurant_id);
  const hasBranchStaff = !limits || limits.features?.branch_staff;

  const { data: pendingCount = 0 } = usePendingOrdersCount('branch_id', branchStaffInfo?.branch_id);

  useOrdersRealtime({
    filterColumn: 'branch_id',
    filterValue: branchStaffInfo?.branch_id,
    queryKey: ['branch_orders', branchStaffInfo?.branch_id, 'dashboard'],
  });
  useOrdersRealtime({
    filterColumn: 'branch_id',
    filterValue: branchStaffInfo?.branch_id,
    queryKey: ['branch_orders', branchStaffInfo?.branch_id, 'whatsapp'],
  });

  useEffect(() => { setPage(1); }, [searchQuery, timeFilter, statusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!order.id.toLowerCase().includes(q) && !order.customer_name.toLowerCase().includes(q) && !order.customer_phone.includes(q)) return false;
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

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery('');
    setTimeFilter(null);
    setStatusFilter(null);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  if (loading || userTypeLoading || ordersLoading || (limits === undefined && branchStaffInfo?.restaurant_id)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  if (!hasBranchStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">غير متاح حالياً</h2>
          <p className="text-muted-foreground mb-4">اشتراك المطعم لا يشمل ميزة موظفي الفروع. يرجى التواصل مع صاحب المطعم لترقية الباقة.</p>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2 mx-auto">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">طلبات الفرع</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    موظف فرع
                  </Badge>
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="dashboard">طلبات لوحة التحكم</TabsTrigger>
            <TabsTrigger value="whatsapp">طلبات واتساب</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className={`mb-6 border-2 ${pendingCount > 0 ? 'border-orange-400 bg-orange-50' : 'border-muted'}`}>
          <CardContent className="flex items-center justify-between py-5">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-14 h-14 rounded-full ${pendingCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p key={pendingCount} className={`text-3xl font-bold ${pendingCount > 0 ? 'text-orange-600 animate-scale-in' : 'text-muted-foreground'}`}>{pendingCount}</p>
                <p className="text-sm text-muted-foreground">طلبات جديدة بانتظار المراجعة</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-muted-foreground" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
              <Switch checked={soundEnabled} onCheckedChange={toggleSound} />
            </div>
          </CardContent>
        </Card>

        <OrderStats orders={orders} isBranchStaff />

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
                <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد طلبات</h3>
                <p className="text-muted-foreground text-center">
                  {totalCount > 0 ? 'لا توجد طلبات تطابق الفلاتر المحددة' : 'لم يتم استلام أي طلبات لفرعك حتى الآن'}
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
      </div>
    </div>
  );
}
