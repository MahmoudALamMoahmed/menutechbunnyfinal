import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  ArrowUp
} from "lucide-react";

const Footer = () => {
  // دالة التمرير لأعلى الصفحة
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-cairo font-bold text-xl">م</span>
              </div>
              <div>
                <h3 className="font-cairo font-bold text-xl">منيو تك</h3>
                <p className="font-tajawal text-sm text-gray-400">للمطاعم الذكية</p>
              </div>
            </div>
            <p className="font-tajawal text-gray-300 leading-relaxed">
              نساعد أصحاب المطاعم في تطوير أعمالهم من خلال منصة المينيو الإلكتروني الأكثر تطوراً في المنطقة
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-cairo font-bold text-lg mb-6">روابط سريعة</h4>
            <ul className="space-y-3">
              {[
                { name: "الرئيسية", href: "#home" },
                { name: "المميزات", href: "#features" },
                { name: "الأسعار", href: "#pricing" },
                { name: "آراء العملاء", href: "#testimonials" },
                { name: "المدونة", href: "#blog" },
                { name: "الدعم الفني", href: "#support" }
              ].map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="font-tajawal text-gray-300 hover:text-secondary transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-cairo font-bold text-lg mb-6">خدماتنا</h4>
            <ul className="space-y-3">
              {[
                "تصميم المينيو الإلكتروني",
                "ربط الواتساب",
                "لوحة تحكم المطعم",
                "تقارير المبيعات",
                "دعم فني مستمر",
                "تدريب الفريق"
              ].map((service) => (
                <li key={service}>
                  <span className="font-tajawal text-gray-300">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-cairo font-bold text-lg mb-6">تواصل معنا</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-success" />
                <a 
                  href="https://wa.me/21110662947" 
                  className="font-tajawal text-gray-300 hover:text-success transition-colors duration-200"
                >
                  +21110662947
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <a 
                  href="tel:+21110662947" 
                  className="font-tajawal text-gray-300 hover:text-primary transition-colors duration-200"
                >
                  +21110662947
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <a 
                  href="mailto:menutech2@gmail.com" 
                  className="font-tajawal text-gray-300 hover:text-accent transition-colors duration-200"
                >
                  menutech2@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary mt-1" />
                <span className="font-tajawal text-gray-300">
                  الرياض، المملكة العربية السعودية
                </span>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h5 className="font-cairo font-semibold text-white mb-2">ساعات العمل</h5>
              <div className="font-tajawal text-sm text-gray-300 space-y-1">
                <div>الأحد - الخميس: 9:00 ص - 6:00 م</div>
                <div>الجمعة - السبت: 10:00 ص - 4:00 م</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-tajawal text-gray-400">
              <a href="#" className="hover:text-white transition-colors duration-200">سياسة الخصوصية</a>
              <a href="#" className="hover:text-white transition-colors duration-200">شروط الاستخدام</a>
              <a href="#" className="hover:text-white transition-colors duration-200">اتفاقية الخدمة</a>
            </div>
            
            <div className="text-center md:text-right">
              <p className="font-tajawal text-sm text-gray-400">
                © 2026 منيو تك. جميع الحقوق محفوظة.
              </p>
            </div>

            {/* Scroll to Top */}
            <button
              onClick={scrollToTop}
              className="w-10 h-10 bg-primary hover:bg-primary-light rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <ArrowUp className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;