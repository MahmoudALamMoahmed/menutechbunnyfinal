import { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurantData';

interface ProtectedRouteProps {
  children: ReactNode;
  /** يتطلب أن يكون المستخدم صاحب المطعم */
  requireOwner?: boolean;
  /** يسمح أيضاً لموظف الفرع التابع لنفس المطعم بالدخول لهذه الصفحة */
  allowBranchStaff?: boolean;
  /** يسمح فقط لـ super_admin */
  requireSuperAdmin?: boolean;
  /** يسمح فقط لـ sales أو super_admin */
  requireSales?: boolean;
}

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
  allowBranchStaff = false,
  requireSuperAdmin = false,
  requireSales = false,
}: ProtectedRouteProps) {
  const { username } = useParams<{ username: string }>();
  const {
    user, loading, userTypeLoading,
    isBranchStaff, branchStaffInfo,
    isSuperAdmin, isSales,
    username: authUsername,
  } = useAuth();

  // جلب بيانات المطعم فقط إذا كان المسار يحتوي على username
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(
    requireOwner ? username : undefined
  );

  if (loading || userTypeLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;

  // Super Admin
  if (requireSuperAdmin) {
    if (!isSuperAdmin) return <Navigate to="/" replace />;
    return <>{children}</>;
  }

  // Sales
  if (requireSales) {
    if (!isSales && !isSuperAdmin) return <Navigate to="/" replace />;
    return <>{children}</>;
  }

  // صفحات صاحب المطعم
  if (requireOwner) {
    // موظف الفرع
    if (isBranchStaff && branchStaffInfo) {
      // إن لم تكن الصفحة مسموحة لموظف الفرع → غير مصرح
      if (!allowBranchStaff) return <UnauthorizedScreen />;
      // يجب أن يخص المطعم نفسه
      if (branchStaffInfo.restaurantUsername !== username) return <UnauthorizedScreen />;
      return <>{children}</>;
    }

    if (restaurantLoading) return <LoadingScreen />;

    // التحقق من ملكية المطعم
    if (username && username !== authUsername) {
      return <UnauthorizedScreen />;
    }

    return <>{children}</>;
  }

  return <>{children}</>;
}
