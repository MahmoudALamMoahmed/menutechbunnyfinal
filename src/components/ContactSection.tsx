import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Send,
  CheckCircle,
  ArrowLeft,
  Loader2,
  ChevronsUpDown,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit } from "@/hooks/useRateLimit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { flag: "🇪🇬", name: "مصر", code: "+20" },
  { flag: "🇸🇦", name: "السعودية", code: "+966" },
  { flag: "🇦🇪", name: "الإمارات", code: "+971" },
  { flag: "🇰🇼", name: "الكويت", code: "+965" },
  { flag: "🇶🇦", name: "قطر", code: "+974" },
  { flag: "🇧🇭", name: "البحرين", code: "+973" },
  { flag: "🇴🇲", name: "عُمان", code: "+968" },
  { flag: "🇮🇶", name: "العراق", code: "+964" },
  { flag: "🇯🇴", name: "الأردن", code: "+962" },
  { flag: "🇸🇾", name: "سوريا", code: "+963" },
  { flag: "🇵🇸", name: "فلسطين", code: "+970" },
  { flag: "🇱🇧", name: "لبنان", code: "+961" },
  { flag: "🇱🇾", name: "ليبيا", code: "+218" },
  { flag: "🇹🇳", name: "تونس", code: "+216" },
  { flag: "🇩🇿", name: "الجزائر", code: "+213" },
  { flag: "🇲🇦", name: "المغرب", code: "+212" },
  { flag: "🇸🇩", name: "السودان", code: "+249" },
  { flag: "🇾🇪", name: "اليمن", code: "+967" },
];

const ContactSection = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countryCode, setCountryCode] = useState('+20');
  const [countryOpen, setCountryOpen] = useState(false);
  const { toast } = useToast();
  const { isLimited, remaining, recordAction } = useRateLimit('contact_form', 60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLimited) {
      toast({
        title: 'يرجى الانتظار',
        description: `يمكنك الإرسال مرة أخرى بعد ${remaining} ثانية`,
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim() || !phone.trim()) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى إدخال الاسم ورقم الهاتف',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_leads')
        .insert({
          name: name.trim(),
          phone: `${countryCode}${phone.trim()}`,
          restaurant_name: restaurantName.trim() || null,
          message: message.trim() || null,
        });

      if (error) throw error;

      setIsSubmitted(true);
      recordAction();
      toast({ title: 'تم الإرسال بنجاح', description: 'سنتواصل معك قريباً!' });
    } catch {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الإرسال، حاول مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-cairo font-bold text-4xl md:text-5xl text-foreground mb-6">
                تواصل معنا الآن
              </h2>
              <p className="font-tajawal text-xl text-muted-foreground">
                جاهزين نساعدك تطلق مطعمك للمرحلة الجاية. تواصل معنا واحصل على استشارة مجانية
              </p>
            </div>

            {/* Contact Options */}
            <div className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-cairo font-bold text-foreground">واتساب</h3>
                      <p className="font-tajawal text-muted-foreground">للرد السريع والدعم المباشر</p>
                    </div>
                    <Button 
                      className="bg-success hover:bg-success/90 text-white font-cairo"
                      onClick={() => window.open('https://wa.me/21110662947', '_blank')}
                    >
                      تواصل
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-cairo font-bold text-foreground">هاتف</h3>
                      <p className="font-tajawal text-muted-foreground">+21110662947</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-cairo"
                      onClick={() => window.location.href = 'tel:+21110662947'}
                    >
                      اتصل الآن
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-cairo font-bold text-foreground">إيميل</h3>
                      <p className="font-tajawal text-muted-foreground">menutech2@gmail.com</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-2 border-accent text-accent hover:bg-accent hover:text-white font-cairo"
                      onClick={() => window.location.href = 'mailto:menutech2@gmail.com'}
                    >
                      راسلنا
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <h3 className="font-cairo font-bold text-xl text-foreground">ليش تختارنا؟</h3>
              {[
                "إعداد مجاني ودعم كامل",
                "تصميم احترافي يناسب مطعمك",
                "دعم فني 24/7",
                "أسعار تنافسية وباقات مرنة"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-tajawal text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-white shadow-elegant border-0">
            <CardContent className="p-8">
              {isSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-cairo font-bold text-2xl text-foreground">تم إرسال طلبك بنجاح!</h3>
                  <p className="font-tajawal text-muted-foreground">سنتواصل معك خلال 24 ساعة عبر الواتساب</p>
                  <Button
                    variant="outline"
                    className="font-cairo mt-4"
                    onClick={() => {
                      setIsSubmitted(false);
                      setName('');
                      setPhone('');
                      setRestaurantName('');
                      setMessage('');
                      setCountryCode('+20');
                    }}
                  >
                    إرسال طلب آخر
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="font-cairo font-bold text-2xl text-foreground mb-2">
                      احصل على استشارة مجانية
                    </h3>
                    <p className="font-tajawal text-muted-foreground">
                      اترك بياناتك وهنتواصل معك خلال 24 ساعة
                    </p>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-cairo font-semibold text-foreground block mb-2">
                          الاسم *
                        </label>
                        <Input 
                          placeholder="أدخل اسمك" 
                          className="font-tajawal text-right border-2 focus:border-primary"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="font-cairo font-semibold text-foreground block mb-2">
                          رقم الهاتف واتساب *
                        </label>
                        <div className="flex" dir="ltr">
                          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={countryOpen}
                                className="h-10 rounded-l-md rounded-r-none border-2 border-r-0 focus:border-primary px-2 gap-1 min-w-[100px] justify-between font-tajawal shrink-0"
                              >
                                <span className="flex items-center gap-1 text-sm">
                                  {COUNTRIES.find(c => c.code === countryCode)?.flag}
                                  <span>{countryCode}</span>
                                </span>
                                <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="ابحث عن دولة..." className="font-tajawal" dir="rtl" />
                                <CommandList>
                                  <CommandEmpty className="font-tajawal py-4 text-center text-sm">لا توجد نتائج</CommandEmpty>
                                  <CommandGroup>
                                    {COUNTRIES.map((country) => (
                                      <CommandItem
                                        key={country.code}
                                        value={`${country.name} ${country.code}`}
                                        onSelect={() => {
                                          setCountryCode(country.code);
                                          setCountryOpen(false);
                                        }}
                                        className="flex items-center gap-2 cursor-pointer font-tajawal"
                                        dir="rtl"
                                      >
                                        <span className="text-lg">{country.flag}</span>
                                        <span className="flex-1">{country.name}</span>
                                        <span className="text-muted-foreground text-xs" dir="ltr">{country.code}</span>
                                        <Check className={cn("h-4 w-4", countryCode === country.code ? "opacity-100" : "opacity-0")} />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <Input 
                            placeholder="1xxxxxxxxx"
                            className="font-tajawal rounded-r-md rounded-l-none border-2 focus:border-primary text-left"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-cairo font-semibold text-foreground block mb-2">
                        اسم المطعم
                      </label>
                      <Input 
                        placeholder="أدخل اسم مطعمك" 
                        className="font-tajawal text-right border-2 focus:border-primary"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="font-cairo font-semibold text-foreground block mb-2">
                        الرسالة
                      </label>
                      <Textarea 
                        placeholder="أخبرنا عن احتياجاتك أو أي أسئلة تود طرحها..." 
                        rows={4}
                        className="font-tajawal text-right border-2 focus:border-primary resize-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting || isLimited}
                      className="w-full bg-gradient-primary text-white font-cairo font-bold text-lg py-6 rounded-xl hover:shadow-glow transition-all duration-300"
                    >
                      {isLimited ? (
                        `يمكنك الإرسال بعد ${remaining} ثانية`
                      ) : isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          إرسال الطلب
                          <Send className="w-5 h-5 mr-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-center font-tajawal text-sm text-muted-foreground">
                      بإرسال هذا النموذج، أنت توافق على 
                      <span className="text-primary cursor-pointer"> شروط الاستخدام </span>
                      و
                      <span className="text-primary cursor-pointer"> سياسة الخصوصية</span>
                    </p>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
