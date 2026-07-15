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
import { Wallet, Plus, Loader2, Building2, User, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];
const SHIFT_TYPES = ["صباحي", "مسائي", "ليلي"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
  branch: BRANCHES[0],
  shift_type: "صباحي",
  date: today,
  employee_name: "",
  total_sales: "",
  total_expenses: "",
  notes: "",
};

export default function ShiftHandover() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: handovers = [], isLoading } = useQuery({
    queryKey: ["shift-handovers"],
    queryFn: () => base44.entities.ShiftHandover.list("-date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.ShiftHandover.create({
      ...payload,
      total_sales: payload.total_sales ? parseFloat(payload.total_sales) : 0,
      total_expenses: payload.total_expenses ? parseFloat(payload.total_expenses) : 0,
      net_amount: (payload.total_sales ? parseFloat(payload.total_sales) : 0) - (payload.total_expenses ? parseFloat(payload.total_expenses) : 0),
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["shift-handovers"] });
      logActivity({ action_type: "create", entity_type: "shift_handover", entity_id: data.id, entity_label: `${data.branch} - ${data.date}` });
      toast({ title: "تم الحفظ", description: "تم تسجيل تسليم الشيفت" });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تسجيل التسليم", variant: "destructive" }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const netPreview = (parseFloat(form.total_sales) || 0) - (parseFloat(form.total_expenses) || 0);

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">تسليم الشيفت</h1>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> تسليم شيفت جديد
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : handovers.length === 0 ? (
        <Card className="p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد تسليمات شيفت</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">الفرع</th>
                  <th className="p-3 font-semibold">نوع الشيفت</th>
                  <th className="p-3 font-semibold">التاريخ</th>
                  <th className="p-3 font-semibold">الموظف</th>
                  <th className="p-3 font-semibold">إجمالي المبيعات</th>
                  <th className="p-3 font-semibold">إجمالي المصروفات</th>
                  <th className="p-3 font-semibold">الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {handovers.map((h) => {
                  const net = (h.net_amount != null ? h.net_amount : (h.total_sales || 0) - (h.total_expenses || 0));
                  return (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-gray-700">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {h.branch || "—"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700">{h.shift_type || "—"}</span>
                      </td>
                      <td className="p-3 text-gray-600">{h.date ? new Date(h.date).toLocaleDateString("ar-EG") : "—"}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-gray-600">
                          <User className="w-3 h-3 text-gray-400" />
                          {h.employee_name || "—"}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-green-700">{(h.total_sales || 0).toLocaleString("ar-EG")} ج</td>
                      <td className="p-3 font-medium text-red-600">{(h.total_expenses || 0).toLocaleString("ar-EG")} ج</td>
                      <td className="p-3">
                        <span className={`font-bold ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
                          {net.toLocaleString("ar-EG")} ج
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>تسليم شيفت جديد</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialogOpen(false)}>✕</Button>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
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
                <Label>نوع الشيفت</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.shift_type}
                  onChange={(e) => setForm({ ...form, shift_type: e.target.value })}
                >
                  {SHIFT_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>التاريخ</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الموظف</Label>
                <Input value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} placeholder="اسم الموظف" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>إجمالي المبيعات (ج)</Label>
                <Input type="number" step="0.01" value={form.total_sales} onChange={(e) => setForm({ ...form, total_sales: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>إجمالي المصروفات (ج)</Label>
                <Input type="number" step="0.01" value={form.total_expenses} onChange={(e) => setForm({ ...form, total_expenses: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-teal-700 flex items-center gap-1">
                <Minus className="w-4 h-4" /> الصافي المتوقع
              </span>
              <span className={`font-bold ${netPreview >= 0 ? "text-green-700" : "text-red-600"}`}>
                {netPreview.toLocaleString("ar-EG")} ج
              </span>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[70px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
