import { useState, useEffect } from "react";
import PageTransition from "@/components/PageTransition";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRestaurant } from "@/hooks/useAdminData";
import { useSaveRestaurant } from "@/hooks/admin-mutations/useRestaurantMutations";
import { ArrowRight, Save, MapPin, Mail, Clock, Facebook, Instagram } from "lucide-react";

export default function FooterManagement() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // React Query - جلب بيانات المطعم
  const { data: restaurant, isLoading: restaurantLoading } = useAdminRestaurant(username);
  // React Query Mutation - حفظ بيانات الفوتر
  const saveRestaurantMut = useSaveRestaurant(username);

  // UI State - بيانات نموذج الفوتر
  const [formData, setFormData] = useState({
    address: "",
    email: "",
    facebook_url: "",
    instagram_url: "",
    working_hours: "يومياً من 9 صباحاً إلى 11 مساءً",
  });

  // Auth Guard مُدار مركزياً عبر ProtectedRoute في App.tsx

  // Data Sync - مزامنة بيانات المطعم إلى النموذج المحلي
  useEffect(() => {
    if (restaurant) {
      setFormData({
        address: restaurant.address || "",
        email: restaurant.email || "",
        facebook_url: restaurant.facebook_url || "",
        instagram_url: restaurant.instagram_url || "",
        working_hours: restaurant.working_hours || "يومياً من 9 صباحاً إلى 11 مساءً",
      });
    }
  }, [restaurant]);

  // دالة حفظ بيانات الفوتر عبر React Query Mutation
  const handleSave = () => {
    if (!user || !restaurant) return;
    saveRestaurantMut.mutate({
      id: restaurant.id,
      data: { ...formData, name: restaurant.name, username: restaurant.username },
      ownerId: user.id,
    });
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600">المطعم غير موجود</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(`/${username}/dashboard`)}>
                <ArrowRight className="w-4 h-4" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">إدارة الفوتر</h1>
                <p className="text-gray-600 text-sm">إدارة معلومات التواصل وبيانات الفوتر لمطعم {restaurant.name}</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saveRestaurantMut.isPending}>
              {saveRestaurantMut.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                الموقع والتواصل
              </CardTitle>
              <CardDescription>العنوان الرئيسي والبريد الإلكتروني</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">العنوان الرئيسي (الدولة/المدينة)</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="المملكة العربية السعودية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="info@restaurant.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                وسائل التواصل الاجتماعي
              </CardTitle>
              <CardDescription>روابط وسائل التواصل ومواعيد العمل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook_url">رابط صفحة الفيسبوك</Label>
                <Input
                  id="facebook_url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, facebook_url: e.target.value }))}
                  placeholder="https://facebook.com/restaurant-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram_url">رابط صفحة الانستغرام</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, instagram_url: e.target.value }))}
                  placeholder="https://instagram.com/restaurant-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="working_hours">مواعيد العمل</Label>
                <Input
                  id="working_hours"
                  value={formData.working_hours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, working_hours: e.target.value }))}
                  placeholder="يومياً من 9 صباحاً إلى 11 مساءً"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>معاينة الفوتر</CardTitle>
            <CardDescription>هكذا سيظهر الفوتر في صفحة المطعم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-white p-8 rounded-lg">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-primary">{restaurant.name}</h3>
                  {formData.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{formData.address}</span>
                    </div>
                  )}
                  {formData.working_hours && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{formData.working_hours}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold">التواصل الرقمي</h4>
                  {formData.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-gray-300">{formData.email}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {formData.facebook_url && (
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Facebook className="w-4 h-4" />
                      </div>
                    )}
                    {formData.instagram_url && (
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Instagram className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold">معلومات إضافية</h4>
                  <div className="text-gray-300 text-xs space-y-1">
                    <p>نسعى لتقديم أفضل خدمة</p>
                    <p>جميع أطباقنا طازجة</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-6 pt-4 text-center text-gray-400 text-xs">
                <p>جميع الحقوق محفوظة لـ منيو تك © 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
