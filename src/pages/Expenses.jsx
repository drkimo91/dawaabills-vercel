import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { logActivity } from "@/lib/activityLogger";
import { Receipt, Plus, Pencil, Trash2, Loader2, Filter, Calendar, Building2, User, Tag } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];
const CATEGORIES = ["إيجار", "كهرباء", "مياه", "رواتب", "صيانة", "نقل", "أدوية", "مستلزمات", "تسويق", "أخرى"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const today = new Date().toISOString().split("T")[0];
const firstOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

const emptyForm = {
  description: "",
  amount: "",
  branch: BRANCHES[0],
  category: "أخرى",
  date: today,
  team_member_name: "",
  notes: "",
};

export default function Expenses() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [branchFilter, setBranchFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.list("name"),
  });

  const { data: allExpenses = [], isLoading } = useQuery({
    queryKey: ["expenses-list"],
    queryFn: () => base44.entities.Expense.list("-date", 5000),
  });

  const filtered = allExpenses.filter((e) => {
    if (branchFilter && e.branch !== branchFilter) return false;
    const d = e.date || (e.created_date || "").split("T")[0];
    if (dateFrom && (!d || d < dateFrom)) return false;
    if (dateTo && (!d || d > dateTo)) return false;
    return true;
  });

  const totalAmount = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.Expense.create({
      ...payload,
      amount: payload.amount ? parseFloat(payload.amount) : 0,
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["expenses-list"] });
      logActivity({ action_type: "create", entity_type: "expense", entity_id: data.id, entity_label: data.description });
      toast({ title: "تمت الإضافة", description: "تم إضافة المصروف بنجاح" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر إضافة المصروف", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => base44.entities.Expense.update(id, {
      ...payload,
      amount: payload.amount ? parseFloat(payload.amount) : 0,
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["expenses-list"] });
      logActivity({ action_type: "update", entity_type: "expense", entity_id: data.id, entity_label: data.description });
      toast({ title: "تم التعديل", description: "تم تحديث المصروف" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تحديث المصروف", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses-list"] });
      logActivity({ action_type: "delete", entity_type: "expense", entity_id: deleteId });
      toast({ title: "تم الحذف", description: "تم حذف المصروف" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر حذف المصروف", variant: "destructive" }),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({
      description: e.description || "",
      amount: e.amount?.toString() || "",
      branch: e.branch || BRANCHES[0],
      category: e.category || "أخرى",
      date: e.date || today,
      team_member_name: e.team_member_name || "",
      notes: e.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, payload: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">المصروفات</h1>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> إضافة مصروف
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">كل الفروع</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> من</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-auto" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> إلى</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-auto" />
          </div>
          {(branchFilter || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setBranchFilter(""); setDateFrom(""); setDateTo(""); }}>
              مسح الفلاتر
            </Button>
          )}
          <div className="mr-auto text-sm">
            <span className="text-gray-500">الإجمالي: </span>
            <span className="font-bold text-teal-700">{totalAmount.toLocaleString("ar-EG")} ج</span>
            <span className="text-gray-400 mr-2">({filtered.length} مصروف)</span>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد مصروفات</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">الوصف</th>
                  <th className="p-3 font-semibold">المبلغ</th>
                  <th className="p-3 font-semibold">الفرع</th>
                  <th className="p-3 font-semibold">الفئة</th>
                  <th className="p-3 font-semibold">التاريخ</th>
                  <th className="p-3 font-semibold">المسؤول</th>
                  <th className="p-3 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{e.description || "—"}</td>
                    <td className="p-3 font-semibold text-teal-700">{(e.amount || 0).toLocaleString("ar-EG")} ج</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {e.branch || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 flex items-center gap-1 w-fit">
                        <Tag className="w-2.5 h-2.5" />
                        {e.category || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{e.date || "—"}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <User className="w-3 h-3 text-gray-400" />
                        {e.team_member_name || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(e)}>
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(e.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل مصروف" : "إضافة مصروف جديد"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialogOpen(false)}>✕</Button>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>الوصف *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف المصروف" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>المبلغ (ج) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <Label>الفئة</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>الفرع</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                >
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>المسؤول</Label>
              <Input
                list="member-list"
                value={form.team_member_name}
                onChange={(e) => setForm({ ...form, team_member_name: e.target.value })}
                placeholder="اسم المسؤول"
              />
              <datalist id="member-list">
                {members.map((m) => <option key={m.id} value={m.name} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
        <DialogContent>
          <p className="text-sm text-gray-600">هل أنت متأكد من حذف هذا المصروف؟</p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حذف"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
