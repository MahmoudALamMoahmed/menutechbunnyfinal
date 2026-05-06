import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRestaurant } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Wallet as WalletIcon,
  Plus,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  TimerOff,
} from "lucide-react";

function useCountdown(expiresAt: string | null | undefined, status: string) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "pending" || !expiresAt) {
      setTimeLeft(null);
      return;
    }

    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(calc());
    const interval = setInterval(() => {
      const diff = calc();
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, status]);

  return timeLeft;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function TransactionItem({ tx }: { tx: any }) {
  const timeLeft = useCountdown(tx.expires_at, tx.status);
  const isExpiredLocally = tx.status === "pending" && timeLeft !== null && timeLeft <= 0;
  const displayStatus = isExpiredLocally ? "expired" : tx.status;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 ml-1" />
            ناجحة
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />
            فاشلة
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            <TimerOff className="w-3 h-3 ml-1" />
            منتهية
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 ml-1" />
            قيد الانتظار
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">شحن محفظة</p>
          <p className="text-xs text-muted-foreground">
            {new Date(tx.created_at).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
      <div className="text-left space-y-1">
        <p className="font-bold text-foreground">+{Number(tx.amount).toFixed(2)} ج.م</p>
        {getStatusBadge(displayStatus)}
        {displayStatus === "pending" && timeLeft !== null && timeLeft > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            متبقي {formatCountdown(timeLeft)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Wallet() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: restaurant } = useAdminRestaurant(username);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const restaurantId = restaurant?.id;

  // Auth Guard مُدار مركزياً عبر ProtectedRoute في App.tsx

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "done") {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      }, 2000);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [queryClient]);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("*").eq("restaurant_id", restaurantId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["wallet-transactions", wallet?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!wallet,
  });

  const handleTopUp = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 10) {
      toast({ title: "خطأ", description: "الحد الأدنى للشحن 10 ج.م", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-session", {
        body: { amount: parsedAmount, username },
      });

      if (error) throw error;
      if (data?.sessionUrl) {
        window.open(data.sessionUrl, "_blank");
        toast({ title: "تم فتح صفحة الدفع", description: "أكمل عملية الدفع في النافذة الجديدة" });
        setAmount("");
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
        }, 5000);
      } else {
        throw new Error(data?.error || "فشل إنشاء جلسة الدفع");
      }
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message || "حدث خطأ غير متوقع", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted" dir="rtl">
      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(`/${username}/dashboard`)}>
                <ArrowRight className="w-4 h-4" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">المحفظة</h1>
                <p className="text-muted-foreground text-sm">إدارة رصيدك ومعاملاتك</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={refreshData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <WalletIcon className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-1">رصيدك الحالي</p>
                <p className="text-4xl font-bold text-foreground">
                  {wallet ? Number(wallet.balance).toFixed(2) : "0.00"}{" "}
                  <span className="text-lg text-muted-foreground">ج.م</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                شحن المحفظة
              </CardTitle>
              <CardDescription>أدخل المبلغ المراد شحنه (الحد الأدنى 10 ج.م)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="amount" className="sr-only">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="10"
                    step="1"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <Button onClick={handleTopUp} disabled={isLoading} className="min-w-[140px]">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 ml-2" />
                      شحن الآن
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                {[50, 100, 200, 500].map((val) => (
                  <Button key={val} variant="outline" size="sm" className="flex-1" onClick={() => setAmount(String(val))}>
                    {val} ج.م
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                يدعم: بطاقات بنكية، فودافون كاش، اتصالات كاش، أورانج كاش، وخدمات BNPL
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                سجل المعاملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد معاملات بعد</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx: any) => (
                    <TransactionItem key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
