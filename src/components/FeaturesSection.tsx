import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, 
  MessageCircle, 
  Settings, 
  BarChart3, 
  Palette, 
  Clock, 
  Shield, 
  Headphones 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Smartphone,
      title: "منيو إلكتروني احترافي",
      description: "تصميم عصري وجذاب يعكس هوية مطعمك ويسهل على العملاء تصفح المأكولات والمشروبات",
      color: "text-primary"
    },
    {
      icon: MessageCircle,
      title: "طلبات عبر الواتساب",
      description: "عملاؤك يقدروا يطلبوا مباشرة عبر الواتساب بضغطة زر واحدة مع كل تفاصيل الطلب",
      color: "text-success"
    },
    {
      icon: Palette,
      title: "تخصيص كامل",
      description: "خصص ألوان وشعار وتصميم المنيو ليناسب هوية مطعمك بالضبط كما تريد",
      color: "text-accent"
    },
    {
      icon: BarChart3,
      title: "لوحة تحكم ذكية",
      description: "تابع الطلبات والمبيعات والتقارير التفصيلية لمساعدتك في اتخاذ قرارات أفضل",
      color: "text-secondary"
    },
    {
      icon: Settings,
      title: "إدارة سهلة",
      description: "أضف أو عدل أو احذف المنتجات والأسعار في ثوانٍ معدودة من لوحة التحكم",
      color: "text-primary"
    },
    {
      icon: Clock,
      title: "متاح 24/7",
      description: "مينيوك متاح للعملاء في أي وقت، حتى خارج ساعات العمل للطلبات المسبقة",
      color: "text-success"
    },
    {
      icon: Shield,
      title: "آمن وموثوق",
      description: "بياناتك وبيانات عملائك محمية بأعلى معايير الأمان والخصوصية",
      color: "text-accent"
    },
    {
      icon: Headphones,
      title: "دعم فني مستمر",
      description: "فريق الدعم الفني متاح لمساعدتك في أي وقت عبر الواتساب أو الهاتف",
      color: "text-secondary"
    }
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-cairo font-bold text-4xl md:text-5xl text-foreground mb-6">
            ليش تختار 
            <span className="bg-gradient-primary bg-clip-text text-transparent"> منيو تك</span>
            ؟
          </h2>
          <p className="font-tajawal text-xl text-muted-foreground max-w-3xl mx-auto">
            نوفرلك كل اللي تحتاجه علشان تطور مطعمك وتزود مبيعاتك مع أحدث التقنيات
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-card transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm"
            >
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="font-cairo font-bold text-xl text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="font-tajawal text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-3xl p-8 shadow-elegant max-w-4xl mx-auto">
            <h3 className="font-cairo font-bold text-3xl text-foreground mb-4">
              جاهز تبدأ رحلتك معنا؟
            </h3>
            <p className="font-tajawal text-lg text-muted-foreground mb-6">
              انضم لأكثر من 500 مطعم اختاروا منيو تك لتطوير أعمالهم
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-success">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="font-cairo">إعداد مجاني</span>
              </div>
              <div className="flex items-center gap-2 text-success">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="font-cairo">بدون رسوم خفية</span>
              </div>
              <div className="flex items-center gap-2 text-success">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="font-cairo">دعم فني مجاني</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;