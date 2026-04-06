import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PageTransition from '@/components/PageTransition';
import { getPasswordStrength } from '@/lib/utils';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const passwordStrength = getPasswordStrength(newPassword);

  // الاستماع لحدث PASSWORD_RECOVERY من Supabase (يعمل مع PKCE و implicit flow)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('password_recovery_in_progress', 'true');
        setIsValidToken(true);
        setChecking(false);
      }
    });

    // fallback: لو المستخدم وصل والـ session موجود بالفعل (recovery تم بالخلفية)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      if (error.message.includes('same as')) {
        setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة');
      } else {
        setError('حدث خطأ أثناء تحديث كلمة المرور، يرجى المحاولة مرة أخرى');
      }
    } else {
      await supabase.auth.signOut();
      sessionStorage.removeItem('password_recovery_in_progress');
      setPasswordUpdated(true);
      toast({
        title: 'تم التحديث',
        description: 'تم تغيير كلمة المرور بنجاح',
      });
    }

    setIsLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // شاشة نجاح تحديث كلمة المرور
  if (passwordUpdated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 text-white rounded-full p-4">
                  <CheckCircle2 size={40} />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-800">تم تغيير كلمة المرور!</CardTitle>
              <CardDescription className="text-green-700 text-base mt-2">
                يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')} className="w-full">
                <ArrowRight className="ml-2 h-4 w-4" />
                الذهاب لتسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // لا يوجد توكن صالح
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">رابط غير صالح</CardTitle>
              <CardDescription>
                هذا الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد لإعادة تعيين كلمة المرور.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate('/forgot-password')} className="w-full">
                طلب رابط جديد
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة لتسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // نموذج تعيين كلمة مرور جديدة
  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground rounded-full p-3">
              <Lock size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تعيين كلمة مرور جديدة</h1>
          <p className="text-gray-600">أدخل كلمة المرور الجديدة لحسابك</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">كلمة المرور الجديدة</CardTitle>
            <CardDescription className="text-center">
              اختر كلمة مرور قوية لا تقل عن 6 أحرف
            </CardDescription>
            <Alert className="mt-3 border-amber-200 bg-amber-50 text-amber-800">
              <AlertDescription className="text-sm">
                ⚠️ هذا الرابط صالح لمرة واحدة فقط. يرجى تغيير كلمة المرور الآن.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* مؤشر قوة كلمة المرور */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.level === 'weak' ? 'text-red-500' : 
                        passwordStrength.level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p className={`flex items-center gap-1 ${newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                        {newPassword.length >= 6 ? <Check size={12} /> : <X size={12} />}
                        6 أحرف على الأقل
                      </p>
                      <p className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                        {/[0-9]/.test(newPassword) ? <Check size={12} /> : <X size={12} />}
                        رقم واحد على الأقل
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                <Lock className="ml-2 h-4 w-4" />
                تحديث كلمة المرور
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
