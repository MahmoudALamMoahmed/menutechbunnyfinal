import { useParams, useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminRestaurant } from "@/hooks/useAdminData";
import { useRestaurantLimits } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Menu,
  BarChart3,
  ShoppingBag,
  ArrowRight,
  Eye,
  Building2,
  Store,
  Wallet,
  Crown,
  MessageCircle,
} from "lucide-react";

export default function Dashboard() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  // React Query - جلب بيانات المطعم
  const { data: restaurant, isLoading: restaurantLoading } = useAdminRestaurant(username);
  const restaurantId = restaurant?.id;
  const { data: limits } = useRestaurantLimits(restaurantId);

  // Auth Guard مُدار مركزياً عبر ProtectedRoute في App.tsx

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

  return (
    <PageTransition className="min-h-screen bg-background" dir="rtl">
      {/* Header - الهيدر */}
      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-foreground text-base">
                    {restaurant ? "لوحة التحكم" : "إنشاء مطعم جديد"}
                  </h1>
                  {limits && (
                    <Badge variant={limits.is_subscribed ? "default" : "secondary"} className="flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {limits.plan_name_ar}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {restaurant ? `${restaurant.name}` : "أنشئ مطعمك الإلكتروني الآن"}
                </p>
              </div>
            </div>
            {restaurant && (
              <Button variant="outline" onClick={() => navigate(`/${restaurant.username}`)}>
                <Eye className="w-4 h-4" />
                المطعم
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
              <CardDescription>اختر ما تريد إدارته</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* زر إدارة معلومات المطعم — يفتح صفحة مستقلة */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/${username}/restaurant-info`)}
              >
                <Store className="w-4 h-4 ml-2" />
                إدارة معلومات المطعم
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!restaurant}
                onClick={() => restaurant && navigate(`/${restaurant.username}/menu-management`)}
              >
                <Menu className="w-4 h-4 ml-2" />
                إدارة القائمة
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!restaurant}
                onClick={() => restaurant && navigate(`/${restaurant.username}/footer-management`)}
              >
                <Settings className="w-4 h-4 ml-2" />
                إدارة الفوتر
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!restaurant}
                onClick={() => restaurant && navigate(`/${restaurant.username}/branches-management`)}
              >
                <Building2 className="w-4 h-4 ml-2" />
                إدارة الفروع
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!restaurant || !limits?.features?.dashboard_orders}
                  onClick={() => restaurant && navigate(`/${restaurant.username}/dashboard-orders`)}
                >
                  <ShoppingBag className="w-4 h-4 ml-2" />
                  طلبات لوحة التحكم
                </Button>
                {limits && !limits.features?.dashboard_orders && (
                  <span className="text-xs text-muted-foreground mr-2">🔒 متاحة في الباقات المدفوعة</span>
                )}
              </div>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!restaurant || !limits?.features?.analytics}
                  onClick={() => restaurant && navigate(`/${restaurant.username}/dashboard-analytics`)}
                >
                  <BarChart3 className="w-4 h-4 ml-2" />
                  تقارير لوحة التحكم
                </Button>
                {limits && !limits.features?.analytics && (
                  <span className="text-xs text-muted-foreground mr-2">🔒 متاحة في الباقات المدفوعة</span>
                )}
              </div>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!restaurant || !limits?.features?.dashboard_orders}
                  onClick={() => restaurant && navigate(`/${restaurant.username}/whatsapp-orders`)}
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  طلبات واتساب
                </Button>
                {limits && !limits.features?.dashboard_orders && (
                  <span className="text-xs text-muted-foreground mr-2">🔒 متاحة في الباقات المدفوعة</span>
                )}
              </div>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!restaurant || !limits?.features?.analytics}
                  onClick={() => restaurant && navigate(`/${restaurant.username}/whatsapp-analytics`)}
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  تقارير واتساب
                </Button>
                {limits && !limits.features?.analytics && (
                  <span className="text-xs text-muted-foreground mr-2">🔒 متاحة في الباقات المدفوعة</span>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!restaurant}
                onClick={() => restaurant && navigate(`/${restaurant.username}/wallet`)}
              >
                <Wallet className="w-4 h-4 ml-2" />
                المحفظة
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!restaurant}
                onClick={() => restaurant && navigate(`/${restaurant.username}/subscription`)}
              >
                <Crown className="w-4 h-4 ml-2" />
                الباقة والاشتراك
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>مساعدة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">هل تحتاج مساعدة في إعداد مطعمك؟</p>
              <Button variant="outline" size="sm" className="w-full">
                تواصل معنا
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
