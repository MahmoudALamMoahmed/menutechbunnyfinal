import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Store, CreditCard, Wallet, ShoppingBag, LogOut, Shield,
} from 'lucide-react';
import OverviewTab from '@/components/super-admin/OverviewTab';
import RestaurantsTab from '@/components/super-admin/RestaurantsTab';
import SubscriptionsTab from '@/components/super-admin/SubscriptionsTab';
import WalletsTab from '@/components/super-admin/WalletsTab';
import OrdersTab from '@/components/super-admin/OrdersTab';

export default function SuperAdmin() {
  const { user, loading, userTypeLoading, isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Auth Guard مُدار مركزياً عبر ProtectedRoute في App.tsx

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      {/* الهيدر */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">لوحة الإدارة الرئيسية</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full flex flex-row-reverse flex-wrap h-auto gap-1 bg-card border p-1">
            <TabsTrigger value="overview" className="flex flex-row-reverse items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex flex-row-reverse items-center gap-2">
              <Store className="w-4 h-4" />
              المطاعم
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex flex-row-reverse items-center gap-2">
              <CreditCard className="w-4 h-4" />
              الاشتراكات
            </TabsTrigger>
            <TabsTrigger value="wallets" className="flex flex-row-reverse items-center gap-2">
              <Wallet className="w-4 h-4" />
              المحافظ
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex flex-row-reverse items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              الطلبات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="restaurants"><RestaurantsTab /></TabsContent>
          <TabsContent value="subscriptions"><SubscriptionsTab /></TabsContent>
          <TabsContent value="wallets"><WalletsTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
