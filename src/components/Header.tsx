import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
const Header = () => {
  // UI State - حالة فتح/إغلاق القائمة الجانبية (موبايل)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, username, signOut, isBranchStaff, branchStaffInfo } = useAuth();
  // دالة تسجيل الخروج والتوجيه للرئيسية
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  // قائمة عناصر التنقل
  const navItems = [
    {
      name: "الرئيسية",
      href: "#home",
    },
    {
      name: "المميزات",
      href: "#features",
    },
    {
      name: "آراء العملاء",
      href: "#testimonials",
    },
    {
      name: "تواصل معنا",
      href: "#contact",
    },
  ];
  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-cairo font-bold text-lg">م</span>
            </div>
            <div>
              <h1 className="font-cairo font-bold text-xl text-foreground">منيو تك</h1>
              <p className="font-tajawal text-xs text-muted-foreground">للمطاعم الذكية</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="font-cairo font-medium text-foreground hover:text-primary transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Buttons - always visible */}
          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              <div className="flex items-center gap-2 md:gap-3">
                <span className="hidden md:inline font-cairo text-sm text-muted-foreground">مرحباً {user.email}</span>
                {isBranchStaff && branchStaffInfo ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/${branchStaffInfo.restaurantUsername}/branch-orders`)}
                    className="font-cairo text-xs md:text-sm"
                  >
                    طلبات فرعي
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => username && navigate(`/${username}`)}
                    disabled={!username}
                    className="font-cairo md:text-sm"
                  >
                    <span className="md:hidden">الدخول لمطعمك</span>
                    <span className="hidden md:inline">الدخول لمطعمك</span>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleSignOut} className="hidden md:inline-flex">
                  <LogOut className="w-4 h-4 ml-1" />
                  تسجيل الخروج
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-cairo hover:bg-primary text-primary hover:text-white md:text-sm"
                  onClick={() => navigate("/auth")}
                >
                  تسجيل الدخول
                </Button>
                <Button
                  size="sm"
                  className="hidden md:inline-flex bg-success hover:bg-success/90 text-white font-cairo px-6"
                  onClick={() => navigate("/auth")}
                >
                  ابدأ الآن
                </Button>
              </>
            )}

            {/* Hamburger - mobile only */}
            <button className="p-2 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="py-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 font-cairo font-medium text-foreground hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              {user && (
                <div className="px-4 py-3 space-y-3">
                  <div className="px-3 py-2 text-sm text-muted-foreground font-cairo">مرحباً {user.email}</div>
                  <Button
                    variant="outline"
                    className="w-full font-cairo"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 ml-1" />
                    تسجيل الخروج
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
export default Header;
