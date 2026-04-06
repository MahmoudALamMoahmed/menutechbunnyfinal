import { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStaffLeads, useUpdateLead, type ContactLead } from '@/hooks/useStaffLeadsData';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from '@/components/super-admin/PaginationControls';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  MessageCircle, Phone, LogOut, Users, UserCheck, UserX, Clock,
  Loader2, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'جديد', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'تم التواصل', color: 'bg-yellow-100 text-yellow-800' },
  converted: { label: 'تم التحويل', color: 'bg-green-100 text-green-800' },
  dismissed: { label: 'مرفوض', color: 'bg-red-100 text-red-800' },
};

export default function StaffLeads() {
  const { user, loading, userTypeLoading, isSales, isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: leads = [], isLoading } = useStaffLeads();
  const updateLead = useUpdateLead();
  const { toast } = useToast();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // Auth Guard مُدار مركزياً عبر ProtectedRoute في App.tsx

  const filtered = filterStatus === 'all' ? leads : leads.filter(l => l.status === filterStatus);

  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
    reset: resetPage,
  } = usePagination(filtered);

  useEffect(() => { resetPage(); }, [filterStatus, resetPage]);

  const stats = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    total: leads.length,
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateLead.mutateAsync({ id, status });
      toast({ title: 'تم التحديث', description: 'تم تحديث حالة الطلب بنجاح' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحديث الحالة', variant: 'destructive' });
    }
  };

  const handleSaveNotes = async (id: string) => {
    const notes = editingNotes[id];
    if (notes === undefined) return;
    try {
      await updateLead.mutateAsync({ id, notes });
      toast({ title: 'تم الحفظ', description: 'تم حفظ الملاحظات بنجاح' });
      setEditingNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
    } catch {
      toast({ title: 'خطأ', description: 'فشل حفظ الملاحظات', variant: 'destructive' });
    }
  };

  const formatPhone = (phone: string) => phone.replace(/[^0-9+]/g, '');

  return (
    <PageTransition className="min-h-screen bg-muted/30" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-cairo font-bold text-lg text-foreground">إدارة العملاء المحتملين</h1>
              <p className="font-tajawal text-sm text-muted-foreground">MenuBunny Sales</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut()} className="font-cairo gap-2">
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الطلبات', value: stats.total, icon: Users, color: 'text-primary' },
            { label: 'جديد', value: stats.new, icon: Clock, color: 'text-blue-600' },
            { label: 'تم التواصل', value: stats.contacted, icon: Phone, color: 'text-yellow-600' },
            { label: 'تم التحويل', value: stats.converted, icon: UserCheck, color: 'text-green-600' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-cairo font-bold text-2xl text-foreground">{stat.value}</p>
                  <p className="font-tajawal text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 font-cairo">
              <SelectValue placeholder="فلترة حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="new">جديد</SelectItem>
              <SelectItem value="contacted">تم التواصل</SelectItem>
              <SelectItem value="converted">تم التحويل</SelectItem>
              <SelectItem value="dismissed">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-cairo">الاسم</TableHead>
                  <TableHead className="font-cairo">الهاتف</TableHead>
                  <TableHead className="font-cairo">اسم المطعم</TableHead>
                  <TableHead className="font-cairo">الرسالة</TableHead>
                  <TableHead className="font-cairo">الحالة</TableHead>
                  <TableHead className="font-cairo">الملاحظات</TableHead>
                  <TableHead className="font-cairo">التاريخ</TableHead>
                  <TableHead className="font-cairo">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 font-tajawal text-muted-foreground">
                      لا توجد طلبات
                    </TableCell>
                  </TableRow>
                ) : paginatedData.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-cairo font-semibold">{lead.name}</TableCell>
                    <TableCell className="font-mono text-sm" dir="ltr">{lead.phone}</TableCell>
                    <TableCell className="font-tajawal">{lead.restaurant_name || '—'}</TableCell>
                    <TableCell className="font-tajawal text-sm max-w-[200px] truncate">{lead.message || '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(v) => handleStatusChange(lead.id, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs font-cairo">
                          <Badge className={`${STATUS_CONFIG[lead.status]?.color || ''} border-0 text-xs`}>
                            {STATUS_CONFIG[lead.status]?.label || lead.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key} className="font-cairo text-sm">
                              {cfg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input
                          className="h-8 text-xs font-tajawal w-32"
                          placeholder="أضف ملاحظة..."
                          value={editingNotes[lead.id] ?? lead.notes ?? ''}
                          onChange={(e) => setEditingNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                        />
                        {editingNotes[lead.id] !== undefined && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveNotes(lead.id)}>
                            <Save className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-tajawal text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:bg-green-50"
                          onClick={() => window.open(`https://wa.me/${formatPhone(lead.phone)}`, '_blank')}
                          title="واتساب"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-primary hover:bg-primary/5"
                          onClick={() => window.location.href = `tel:${formatPhone(lead.phone)}`}
                          title="اتصال"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </main>
    </PageTransition>
  );
}
