import { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurantData';

interface ProtectedRouteProps {
  children: ReactNode;
  /** يتطلب أن يكون المستخدم صاحب المطعم (ليس موظف فرع) */
  requireOwner?: boolean;
  /** يسمح فقط لموظف الفرع */
  requireBranchStaff?: boolean;
  /** يسمح فقط لـ super_admin */
  requireSuperAdmin?: boolean;
  /** يسمح فقط لـ sales أو super_admin */
  requireSales?: boolean;
}

// شاشة تحميل مشتركة
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}

// شاشة عدم الصلاحية
function UnauthorizedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-2">🚫 غير مصرح</h1>
        <p className="text-muted-foreground mb-4">ليس لديك صلاحية للوصول لهذه الصفحة</p>
        <a href="/" className="text-primary underline">العودة للصفحة الرئيسية</a>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  requireOwner = false,
  requireBranchStaff = false,
  requireSuperAdmin = false,
  requireSales = false,
}: ProtectedRouteProps) {
  const { username } = useParams<{ username: string }>();
  const { user, loading, userTypeLoading, isBranchStaff, branchStaffInfo, isSuperAdmin, isSales, username: authUsername } = useAuth();

  // جلب بيانات المطعم فقط إذا كان المسار يحتوي على username (صفحات الأدمن)
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(
    requireOwner || requireBranchStaff ? username : undefined
  );

  // انتظار تحميل المصادقة
  if (loading || userTypeLoading) return <LoadingScreen />;

  // مستخدم غير مسجل → تسجيل الدخول
  if (!user) return <Navigate to="/auth" replace />;

  // صفحات Super Admin
  if (requireSuperAdmin) {
    if (!isSuperAdmin) return <Navigate to="/" replace />;
    return <>{children}</>;
  }

  // صفحات Sales
  if (requireSales) {
    if (!isSales && !isSuperAdmin) return <Navigate to="/" replace />;
    return <>{children}</>;
  }

  // صفحات موظف الفرع
  if (requireBranchStaff) {
    if (!isBranchStaff) return <Navigate to="/" replace />;
    return <>{children}</>;
  }

  // صفحات صاحب المطعم (الأغلب)
  if (requireOwner) {
    // موظف الفرع يُحول لصفحته
    if (isBranchStaff && branchStaffInfo) {
      return <Navigate to={`/${branchStaffInfo.restaurantUsername}/branch-orders`} replace />;
    }

    // انتظار تحميل بيانات المطعم
    if (restaurantLoading) return <LoadingScreen />;

    // التحقق من ملكية المطعم — الـ username في الرابط يجب أن يطابق username المالك من useAuth
    if (username && username !== authUsername) {
      return <UnauthorizedScreen />;
    }

    return <>{children}</>;
  }

  // افتراضي: مصادقة فقط
  return <>{children}</>;
}
