import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * صفحة دخول مستقلة لموظفي الفروع - خاصة بكل مطعم على حدة
 * URL: /:username/branch-staff-login
 * لا يوجد زر يقود إليها — يصلها الموظف عبر لينك يعطيه له صاحب المطعم.
 */
export default function BranchStaffLogin() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isBranchStaff, branchStaffInfo, userTypeLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // لو الموظف داخل بالفعل لهذا المطعم → حوله لصفحة المطعم
  useEffect(() => {
    if (userTypeLoading || !user) return;
    if (isBranchStaff && branchStaffInfo?.restaurantUsername === username) {
      navigate(`/${username}`, { replace: true });
    }
  }, [user, isBranchStaff, branchStaffInfo, userTypeLoading, username, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 1. تسجيل الدخول
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.user) {
      setError('بيانات الدخول غير صحيحة');
      setIsLoading(false);
      return;
    }

    // 2. التحقق أن المستخدم موظف فرع وأنه يخص هذا المطعم
    const { data: staff } = await supabase
      .from('branch_staff')
      .select('restaurant_id, restaurants(username)')
      .eq('user_id', signInData.user.id)
      .maybeSingle();

    const staffUsername = (staff?.restaurants as any)?.username;
    if (!staff || staffUsername !== username) {
      await supabase.auth.signOut();
      setError('هذا الحساب لا يخص هذا المطعم');
      setIsLoading(false);
      return;
    }

    toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً بك' });
    navigate(`/${username}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <CardTitle>دخول موظف الفرع</CardTitle>
          <CardDescription>تسجيل دخول خاص بموظفي فروع المطعم</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> البريد الإلكتروني
              </Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> كلمة المرور
              </Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
