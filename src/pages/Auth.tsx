import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/PageTransition';
import { Loader2, ChefHat, Mail, CheckCircle2, RefreshCw, Eye, EyeOff, Check, X } from 'lucide-react';
import { useUsernameAvailability } from '@/hooks/useAvailabilityCheck';
import { AvailabilityIndicator } from '@/components/AvailabilityIndicator';
import { supabase } from '@/integrations/supabase/client';
import { getPasswordStrength, getErrorMessage } from '@/lib/utils';

export default function Auth() {
  // UI State - بيانات النماذج (إيميل، كلمة مرور، اسم مستخدم، حالة التحميل، الأخطاء)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  
  // UI State - حالات إظهار/إخفاء كلمة المرور
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI State - حالات إعادة إرسال رابط التأكيد
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showResendOption, setShowResendOption] = useState(false);
  
  // حساب قوة كلمة المرور
  const passwordStrength = getPasswordStrength(password);
  
  const { signIn, signUp, user, ensureRestaurantExists, branchStaffInfo, isBranchStaff, isSuperAdmin, isSales, userTypeLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Custom Hook (useState + useEffect + debounce) - التحقق من توفر اسم المستخدم
  const usernameCheck = useUsernameAvailability(username);

  // Timer - عداد تنازلي لإعادة إرسال رابط التأكيد
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // دالة إعادة إرسال رابط التأكيد
  const handleResendConfirmation = async () => {
    const targetEmail = pendingEmail || email;
    if (!targetEmail) return;
    
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
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
        description: 'تم إرسال رابط التأكيد مرة أخرى إلى بريدك الإلكتروني',
      });
      setResendCooldown(60);
    }
    setIsResending(false);
  };

  // Auth Redirect - عند تسجيل الدخول بنجاح، توجيه حسب نوع المستخدم
  useEffect(() => {
    const handleUserSession = async () => {
      if (!user) return;
      if (userTypeLoading) return; // انتظر حتى تكتمل بيانات نوع المستخدم

      // إذا كانت عملية استعادة كلمة المرور جارية → سجّل خروج ولا توجّه
      if (sessionStorage.getItem('password_recovery_in_progress')) {
        await supabase.auth.signOut();
        sessionStorage.removeItem('password_recovery_in_progress');
        return;
      }

      // إذا كان super admin → توجيه للوحة الإدارة
      if (isSuperAdmin) {
        navigate('/super-admin');
        return;
      }

      // إذا كان موظف مبيعات → توجيهه لصفحة العملاء المحتملين
      if (isSales) {
        navigate('/staff-leads');
        return;
      }

      // إذا كان موظف فرع → توجيهه لصفحة الطلبات مباشرة
      if (isBranchStaff && branchStaffInfo) {
        navigate(`/${branchStaffInfo.restaurantUsername}/branch-orders`);
        return;
      }

      // إذا كان صاحب مطعم → إنشاء المطعم إذا لزم والتوجيه
      if (!isBranchStaff) {
        const { created, error } = await ensureRestaurantExists();
        
        if (created) {
          toast({
            title: 'تم إعداد مطعمك بنجاح',
            description: 'مرحباً بك في منصة المطاعم',
          });
        }
        
        if (!error || error.message === 'No pending restaurant data found') {
          navigate('/');
        }
      }
    };
    
    handleUserSession();
  }, [user, isBranchStaff, branchStaffInfo, isSuperAdmin, userTypeLoading, navigate, ensureRestaurantExists, toast]);

  // معالج تسجيل الدخول (form submit) عبر Supabase Auth
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowResendOption(false);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(getErrorMessage(error));
      if (error.message === 'Email not confirmed') {
        setPendingEmail(email);
        setShowResendOption(true);
        setResendCooldown(0);
      }
    } else {
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في منصة المطاعم',
      });
    }
    
    setIsLoading(false);
  };

  // معالج إنشاء حساب جديد (form submit) مع التحقق من المدخلات
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowEmailConfirmation(false);

    if (!username.trim()) {
      setError('اسم المستخدم مطلوب');
      setIsLoading(false);
      return;
    }

    // التحقق من صيغة اسم المستخدم (حروف إنجليزية وأرقام فقط)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط');
      setIsLoading(false);
      return;
    }

    // التحقق من توفر اسم المستخدم
    if (usernameCheck.status === 'taken') {
      setError('اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر');
      setIsLoading(false);
      return;
    }


    if (!restaurantName.trim()) {
      setError('اسم المطعم مطلوب');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setIsLoading(false);
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
      setIsLoading(false);
      return;
    }

    const { error, needsEmailConfirmation } = await signUp(email, password, username, restaurantName);
    
    if (error) {
      setError(getErrorMessage(error));
    } else if (needsEmailConfirmation) {
      // عرض رسالة تأكيد الإيميل
      setPendingEmail(email);
      setResendCooldown(60); // بدء العداد التنازلي
      setShowEmailConfirmation(true);
    } else {
      // تسجيل تلقائي بدون تأكيد إيميل
      toast({
        title: 'تم إنشاء الحساب بنجاح',
        description: 'مرحباً بك في منصة المطاعم',
      });
    }
    
    setIsLoading(false);
  };

  // شاشة تأكيد الإيميل
  if (showEmailConfirmation) {
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
              <CardTitle className="text-2xl text-green-800">تم إنشاء الحساب بنجاح!</CardTitle>
              <CardDescription className="text-green-700 text-base mt-2">
                يرجى التوجه إلى بريدك الإلكتروني لتأكيد الحساب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className="font-medium">تم إرسال رابط التأكيد إلى:</span>
                </div>
                <p className="text-primary font-bold text-lg mr-8">{email}</p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها</p>
                <p>• انقر على رابط التأكيد في الرسالة</p>
                <p>• سيتم توجيهك تلقائياً لإكمال إعداد مطعمك</p>
              </div>
              
              {/* زر إعادة إرسال رابط التأكيد */}
              <div className="text-center mt-4 pt-4 border-t border-green-200">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    يمكنك إعادة الإرسال بعد {resendCooldown} ثانية
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    className="text-green-700 hover:text-green-800 hover:bg-green-100"
                  >
                    {isResending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <RefreshCw className="ml-2 h-4 w-4" />
                    إعادة إرسال رابط التأكيد
                  </Button>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setUsername('');
                  setRestaurantName('');
                  setResendCooldown(0);
                  setPendingEmail('');
                }}
              >
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">منصة المطاعم</h1>
          <p className="text-gray-600">منيو إلكتروني احترافي لمطعمك</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">تسجيل الدخول لأصحاب المطاعم</CardTitle>
            <CardDescription className="text-center">
              أدخل بياناتك للوصول إلى لوحة تحكم مطعمك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">إنشاء حساب جديد</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="example@restaurant.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* زر إعادة إرسال رابط التأكيد عند تسجيل الدخول بحساب غير مؤكد */}
                  {showResendOption && (
                    <div className="text-center py-2">
                      {resendCooldown > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          يمكنك إعادة الإرسال بعد {resendCooldown} ثانية
                        </p>
                      ) : (
                        <Button
                          type="button"
                          variant="link"
                          onClick={handleResendConfirmation}
                          disabled={isResending}
                          className="text-primary"
                        >
                          {isResending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                          <RefreshCw className="ml-2 h-4 w-4" />
                          إعادة إرسال رابط التأكيد
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    تسجيل الدخول
                  </Button>
                  
                  <div className="text-center">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-primary hover:underline"
                    >
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-name">اسم المطعم</Label>
                    <Input
                      id="restaurant-name"
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="اسم مطعمك"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">اسم المستخدم (رابط المطعم)</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      required
                      disabled={isLoading}
                      placeholder="my-restaurant"
                      className="text-left"
                      dir="ltr"
                    />
                    <AvailabilityIndicator status={usernameCheck.status} message={usernameCheck.message} />
                    <p className="text-xs text-muted-foreground">
                      سيكون رابط مطعمك: /{username || 'اسم-المستخدم'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="example@restaurant.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* مؤشر قوة كلمة المرور */}
                    {password && (
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
                        
                        {/* متطلبات كلمة المرور */}
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <p className={`flex items-center gap-1 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                            {password.length >= 6 ? <Check size={12} /> : <X size={12} />}
                            6 أحرف على الأقل
                          </p>
                          <p className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
                            {/[0-9]/.test(password) ? <Check size={12} /> : <X size={12} />}
                            رقم واحد على الأقل
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <X size={12} />
                        كلمات المرور غير متطابقة
                      </p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Check size={12} />
                        كلمات المرور متطابقة
                      </p>
                    )}
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    إنشاء حساب جديد
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}