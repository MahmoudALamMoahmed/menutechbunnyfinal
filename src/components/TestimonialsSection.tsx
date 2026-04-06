import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "أحمد محمد",
      restaurant: "مطعم الأصالة",
      text: "منيو تك غير كل شيء في مطعمي! الطلبات زادت 40% وصار العملاء يطلبوا بسهولة عبر الواتساب. الدعم الفني ممتاز والتصميم احترافي جداً.",
      rating: 5,
      avatar: "👨‍🍳"
    },
    {
      name: "فاطمة السعيد",
      restaurant: "مقهى الياسمين",
      text: "كنت أعاني من تنظيم الطلبات والمنيو الورقي. بعد منيو تك، كل شيء صار منظم وسهل. العملاء يحبوا المنيو الإلكتروني والألوان الحلوة.",
      rating: 5,
      avatar: "👩‍💼"
    },
    {
      name: "خالد العتيبي",
      restaurant: "مطعم الكرم",
      text: "أفضل استثمار عملته لمطعمي. لوحة التحكم تخليني أتابع كل شيء، والعملاء يقدروا يطلبوا حتى خارج ساعات العمل. ممتاز بكل المقاييس!",
      rating: 5,
      avatar: "👨‍💻"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-cairo font-bold text-4xl md:text-5xl text-foreground mb-6">
            آراء عملائنا السعداء
          </h2>
          <p className="font-tajawal text-xl text-muted-foreground max-w-3xl mx-auto">
            شوف إيش يقولوا أصحاب المطاعم عن تجربتهم مع منيو تك
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-0 bg-white shadow-card"
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Quote className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="font-tajawal text-muted-foreground leading-relaxed text-center mb-6">
                  "{testimonial.text}"
                </p>

                {/* Author Info */}
                <div className="text-center">
                  <div className="text-4xl mb-2">{testimonial.avatar}</div>
                  <h4 className="font-cairo font-bold text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="font-tajawal text-sm text-primary">
                    صاحب {testimonial.restaurant}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-hero rounded-3xl p-8 md:p-12 text-center text-white">
          <h3 className="font-cairo font-bold text-3xl md:text-4xl mb-8">
            أرقام تتكلم عن نفسها
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="font-cairo font-bold text-4xl md:text-5xl text-secondary mb-2">+500</div>
              <div className="font-tajawal text-white/80">مطعم ومقهى</div>
            </div>
            <div>
              <div className="font-cairo font-bold text-4xl md:text-5xl text-secondary mb-2">+10K</div>
              <div className="font-tajawal text-white/80">طلب يومي</div>
            </div>
            <div>
              <div className="font-cairo font-bold text-4xl md:text-5xl text-secondary mb-2">98%</div>
              <div className="font-tajawal text-white/80">رضا العملاء</div>
            </div>
            <div>
              <div className="font-cairo font-bold text-4xl md:text-5xl text-secondary mb-2">40%</div>
              <div className="font-tajawal text-white/80">زيادة المبيعات</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;