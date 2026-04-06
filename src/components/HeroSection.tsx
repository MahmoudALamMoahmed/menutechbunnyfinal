import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Users, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-hero flex items-center justify-center overflow-hidden" style={{ contentVisibility: 'auto' }}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-primary/10"></div>
      <div className="absolute top-20 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-right space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 text-white">
              <Star className="w-5 h-5 text-secondary" />
              <span className="font-cairo text-sm">الأفضل في المنطقة</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-cairo font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
              انقل مطعمك للمرحلة 
              <span className="block bg-gradient-to-l from-secondary via-secondary to-accent bg-clip-text text-transparent">
                الجاية
              </span>
            </h1>

            {/* Subheadline */}
            <p className="font-tajawal text-xl md:text-2xl text-white/90 max-w-2xl mx-auto lg:mx-0">
              مع منيو إلكتروني احترافي يخلي عملاؤك يطلبوا بسهولة عبر الواتساب
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 text-white">
              <div className="text-center">
                <div className="font-cairo font-bold text-2xl">+500</div>
                <div className="font-tajawal text-sm opacity-80">مطعم يثق بنا</div>
              </div>
              <div className="text-center">
                <div className="font-cairo font-bold text-2xl">+10K</div>
                <div className="font-tajawal text-sm opacity-80">طلب يومي</div>
              </div>
              <div className="text-center">
                <div className="font-cairo font-bold text-2xl">24/7</div>
                <div className="font-tajawal text-sm opacity-80">دعم فني</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-secondary text-black hover:bg-secondary/90 font-cairo font-semibold text-lg px-8 py-6 rounded-2xl shadow-glow transition-all duration-300 hover:scale-105"
              >
                ابدأ الآن مجاناً
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white/30 text-white bg-transparent hover:bg-white/10 font-cairo font-semibold text-lg px-8 py-6 rounded-2xl backdrop-blur-sm"
              >
                شاهد العرض التوضيحي
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-3 text-white/80">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                ))}
              </div>
              <span className="font-tajawal text-sm">4.9/5 من 200+ تقييم</span>
            </div>
          </div>

          {/* Visual Content */}
          <div className="relative">
            {/* Phone Mockup Container */}
            <div className="relative mx-auto w-80 h-[600px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-elegant">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Screen Content */}
                  <div className="absolute inset-0 bg-gradient-subtle p-6">
                    {/* App Header */}
                    <div className="bg-primary rounded-2xl p-4 mb-4 text-center">
                      <h3 className="font-cairo font-bold text-white text-lg">مطعم الأصالة</h3>
                      <p className="font-tajawal text-white/80 text-sm">أطيب المأكولات الشرقية</p>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="space-y-3">
                      {[
                        { name: "مندي لحم", price: "45 ريال", popular: true },
                        { name: "كبسة دجاج", price: "35 ريال", popular: false },
                        { name: "ملوخية بالفراخ", price: "40 ريال", popular: false },
                      ].map((item, index) => (
                        <div key={index} className="bg-white rounded-xl p-3 shadow-card border border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="text-right">
                              <h4 className="font-cairo font-semibold text-gray-800">{item.name}</h4>
                              <p className="font-tajawal text-primary font-bold">{item.price}</p>
                            </div>
                            {item.popular && (
                              <span className="bg-secondary text-black text-xs px-2 py-1 rounded-full font-cairo">
                                الأكثر طلباً
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* WhatsApp Button */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-success rounded-xl p-3 text-center">
                        <p className="font-cairo font-semibold text-white">اطلب عبر الواتساب</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-white rounded-xl p-3 shadow-card">
                <Users className="w-6 h-6 text-primary" />
                <p className="font-cairo text-xs font-bold text-gray-800 mt-1">+50 طلب</p>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-3 shadow-card">
                <Zap className="w-6 h-6 text-secondary" />
                <p className="font-cairo text-xs font-bold text-gray-800 mt-1">تسليم سريع</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;