import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChefHat, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { supabase } from '@/integrations/supabase/client';

export default function ForgotPassword() {
  // UI State - بيانات النموذج وحالات العرض المختلفة
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // لم يعد هناك حاجة لفحص hash — Supabase يتولى التوجيه تلقائياً عبر PKCE

  // Timer - عداد تنازلي لإعادة إرسال الرابط
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // معالج إرسال رابط إعادة التعيين عبر Supabase Auth
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        setError('تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً');
      } else {
        setError('حدث خطأ أثناء إرسال الرابط، يرجى المحاولة مرة أخرى');
      }
    } else {
      setEmailSent(true);
      setResendCooldown(60);
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
      });
    }

    setIsLoading(false);
  };

  // معالج إعادة إرسال رابط إعادة التعيين
  const handleResend = async () => {
    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل إعادة إرسال الرابط، حاول مرة أخرى لاحقاً',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رابط إعادة التعيين مرة أخرى',
      });
      setResendCooldown(60);
    }

    setIsLoading(false);
  };

  // شاشة تأكيد إرسال الرابط
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 text-white rounded-full p-4">
                  <Mail size={40} />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-800">تم إرسال الرابط!</CardTitle>
              <CardDescription className="text-green-700 text-base mt-2">
                تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className="font-medium">تم إرسال رابط إعادة التعيين إلى:</span>
                </div>
                <p className="text-primary font-bold text-lg mr-8">{email}</p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها</p>
                <p>• انقر على رابط إعادة التعيين في الرسالة</p>
                <p>• سيتم توجيهك لإدخال كلمة مرور جديدة</p>
              </div>
              
              {/* زر إعادة إرسال الرابط */}
              <div className="text-center mt-4 pt-4 border-t border-green-200">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    يمكنك إعادة الإرسال بعد {resendCooldown} ثانية
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-green-700 hover:text-green-800 hover:bg-green-100"
                  >
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <Mail className="ml-2 h-4 w-4" />
                    إعادة إرسال الرابط
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={async () => {
                  sessionStorage.removeItem('password_recovery_in_progress');
                  await supabase.auth.signOut();
                  navigate('/auth');
                }}
              >
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة لتسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground rounded-full p-3">
              <ChefHat size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">نسيت كلمة المرور؟</h1>
          <p className="text-gray-600">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription className="text-center">
              سيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@restaurant.com"
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                <Mail className="ml-2 h-4 w-4" />
                إرسال رابط إعادة التعيين
              </Button>
              
              <Button
                variant="ghost"
                className="w-full"
                type="button"
                onClick={async () => {
                  sessionStorage.removeItem('password_recovery_in_progress');
                  await supabase.auth.signOut();
                  navigate('/auth');
                }}
              >
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة لتسجيل الدخول
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
