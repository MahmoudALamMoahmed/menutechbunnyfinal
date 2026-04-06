import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus, Mail, Lock } from 'lucide-react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Branch = Tables<'branches'>;

interface StaffAccountDialogsProps {
  restaurantId: string;
  // Create dialog
  showCreateDialog: boolean;
  setShowCreateDialog: (v: boolean) => void;
  selectedBranch: Branch | null;
  // Delete dialog
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  staffToDelete: { userId: string; branchName: string } | null;
  setStaffToDelete: (v: { userId: string; branchName: string } | null) => void;
  // Callback
  onSuccess: () => void;
}

export default function StaffAccountDialogs({
  restaurantId, showCreateDialog, setShowCreateDialog, selectedBranch,
  showDeleteDialog, setShowDeleteDialog, staffToDelete, setStaffToDelete, onSuccess,
}: StaffAccountDialogsProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedBranch || !form.email || !form.password) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الإيميل وكلمة المرور', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('create-branch-staff', {
        body: { branch_id: selectedBranch.id, restaurant_id: restaurantId, email: form.email, password: form.password },
      });
      if (response.error || response.data?.error) {
        toast({ title: 'خطأ', description: response.data?.error || 'حدث خطأ أثناء إنشاء الحساب', variant: 'destructive' });
      } else {
        toast({ title: 'تم بنجاح', description: `تم إنشاء حساب للفرع ${selectedBranch.name}` });
        setShowCreateDialog(false);
        setForm({ email: '', password: '' });
        onSuccess();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('delete-branch-staff', {
        body: { staff_user_id: staffToDelete.userId },
      });
      if (response.error || response.data?.error) {
        toast({ title: 'خطأ', description: response.data?.error || 'حدث خطأ أثناء حذف الحساب', variant: 'destructive' });
      } else {
        toast({ title: 'تم الحذف', description: `تم حذف حساب فرع ${staffToDelete.branchName}` });
        setShowDeleteDialog(false);
        setStaffToDelete(null);
        onSuccess();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <>
      {/* Create Staff Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={o => { setShowCreateDialog(o); if (!o) setForm({ email: '', password: '' }); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              إضافة حساب للفرع: {selectedBranch?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">سيتمكن صاحب هذا الحساب من تسجيل الدخول ورؤية طلبات هذا الفرع فقط.</p>
            <div className="space-y-2">
              <Label htmlFor="staffEmail" className="flex items-center gap-2"><Mail className="w-4 h-4" />البريد الإلكتروني</Label>
              <Input id="staffEmail" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="branch@restaurant.com" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffPassword" className="flex items-center gap-2"><Lock className="w-4 h-4" />كلمة المرور</Label>
              <Input id="staffPassword" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="6 أحرف على الأقل" disabled={loading} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={loading}>إلغاء</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                إنشاء الحساب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Account Confirmation */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={o => { setShowDeleteDialog(o); if (!o) setStaffToDelete(null); }}
        onConfirm={handleDelete}
        title="حذف حساب الفرع"
        description={`هل أنت متأكد من حذف حساب فرع "${staffToDelete?.branchName}"؟ لن يستطيع الموظف تسجيل الدخول بعد ذلك.`}
        isLoading={loading}
      />
    </>
  );
}
