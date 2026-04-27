import { useState, useEffect } from "react";
import PageTransition from "@/components/PageTransition";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRestaurant } from "@/hooks/useAdminData";
import { useSaveRestaurant } from "@/hooks/admin-mutations/useRestaurantMutations";
import ImageUploader from "@/components/ImageUploader";
import { getCoverPublicId, getLogoPublicId } from "@/lib/bunny";
import { ArrowRight, Save, Store, ImageIcon } from "lucide-react";

export default function RestaurantInfo() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // React Query - جلب بيانات المطعم
  const { data: restaurant, isLoading: restaurantLoading } = useAdminRestaurant(username);
  // React Query Mutation - حفظ/تحديث بيانات المطعم
  const saveRestaurantMut = useSaveRestaurant(username);

  // UI State - بيانات النموذج
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    description: "",
    email: "",
    cover_image_url: "",
    logo_url: "",
    cover_image_public_id: "",
    logo_public_id: "",
  });

  // Data Sync - مزامنة بيانات المطعم من React Query إلى النموذج المحلي
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        username: restaurant.username || "",
        description: restaurant.description || "",
        email: restaurant.email || "",
        cover_image_url: restaurant.cover_image_url || "",
        logo_url: restaurant.logo_url || "",
        cover_image_public_id: restaurant.cover_image_public_id || "",
        logo_public_id: restaurant.logo_public_id || "",
      });
    } else if (!restaurantLoading && username) {
      setFormData((prev) => ({ ...prev, username }));
    }
  }, [restaurant, restaurantLoading, username]);

  // دالة حفظ بيانات المطعم عبر React Query Mutation
  const handleSave = () => {
    if (!user) return;
    saveRestaurantMut.mutate({
      id: restaurant?.id,
      data: formData,
      ownerId: user.id,
    });
  };

  // حالة التحميل
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
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(`/${username}/dashboard`)}>
                <ArrowRight className="w-4 h-4" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {restaurant ? "إدارة معلومات المطعم" : "إنشاء مطعم جديد"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {restaurant
                    ? `تعديل البيانات الأساسية والصور لمطعم ${restaurant.name}`
                    : "أدخل البيانات الأساسية لإنشاء مطعمك"}
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saveRestaurantMut.isPending || !formData.name || !formData.username}>
              {saveRestaurantMut.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground ml-2" />
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

      {/* المحتوى */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* البيانات الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                البيانات الأساسية
              </CardTitle>
              <CardDescription>اسم المطعم والرابط والوصف</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المطعم *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="مطعم الأصالة"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">اسم المطعم في الرابط *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""),
                    }))
                  }
                  placeholder="hany"
                  required
                  disabled={!!restaurant}
                />
                <p className="text-xs text-muted-foreground">سيكون رابط مطعمك: /{formData.username}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">وصف المطعم</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="نقدم أفضل المأكولات الشرقية والغربية..."
                  rows={4}
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

          {/* الصور */}
          {restaurant ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  صور المطعم
                </CardTitle>
                <CardDescription>صورة الغلاف وشعار المطعم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ImageUploader
                  label="صورة الغلاف"
                  currentImageUrl={formData.cover_image_url}
                  currentPublicId={formData.cover_image_public_id}
                  publicId={getCoverPublicId(restaurant.username)}
                  aspectRatio="cover"
                  imageType="cover"
                  onUploadComplete={(url, publicId) =>
                    setFormData((prev) => ({ ...prev, cover_image_url: url, cover_image_public_id: publicId }))
                  }
                  onDelete={() => setFormData((prev) => ({ ...prev, cover_image_url: "", cover_image_public_id: "" }))}
                />
                <ImageUploader
                  label="شعار المطعم"
                  currentImageUrl={formData.logo_url}
                  currentPublicId={formData.logo_public_id}
                  publicId={getLogoPublicId(restaurant.username)}
                  aspectRatio="logo"
                  imageType="logo"
                  onUploadComplete={(url, publicId) =>
                    setFormData((prev) => ({ ...prev, logo_url: url, logo_public_id: publicId }))
                  }
                  onDelete={() => setFormData((prev) => ({ ...prev, logo_url: "", logo_public_id: "" }))}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  صور المطعم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                  ℹ️ يمكنك رفع صور الغلاف والشعار بعد إنشاء المطعم
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
