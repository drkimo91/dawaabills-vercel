import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { logActivity } from "@/lib/activityLogger";
import { ShieldCheck, Pencil, Loader2, Mail, Building2, Crown } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];
const ROLES = [
  { value: "admin", label: "مدير عام" },
  { value: "manager", label: "مدير" },
  { value: "viewer", label: "مشاهد" },
];

const PERMISSIONS = [
  { key: "can_save_invoice", label: "حفظ الفواتير" },
  { key: "can_delete_invoice", label: "حذف الفواتير" },
  { key: "can_manage_team", label: "إدارة الفريق" },
  { key: "can_set_budget", label: "تحديد الميزانية" },
  { key: "can_view_reports", label: "عرض التقارير" },
  { key: "can_manage_returns", label: "إدارة المرتجعات" },
  { key: "can_manage_expenses", label: "إدارة المصروفات" },
  { key: "can_manage_suppliers", label: "إدارة الموردين" },
  { key: "can_manage_orders", label: "إدارة الطلبات" },
  { key: "can_view_balances", label: "عرض الأرصدة" },
  { key: "can_manage_inventory", label: "إدارة المخزون" },
  { key: "can_manage_attendance", label: "إدارة الحضور" },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const ROLE_COLORS = {
  admin: "bg-red-50 text-red-700 border-red-200",
  manager: "bg-blue-50 text-blue-700 border-blue-200",
  viewer: "bg-gray-50 text-gray-700 border-gray-200",
};

const ROLE_LABELS = { admin: "مدير عام", manager: "مدير", viewer: "مشاهد" };

export default function UserManagement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role: "viewer", branch_access: [], permissions: {} });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("email"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => base44.entities.User.update(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["current-user"] });
      logActivity({ action_type: "update", entity_type: "user", entity_id: data.id, entity_label: data.email });
      toast({ title: "تم التحديث", description: "تم تحديث صلاحيات المستخدم" });
      setEditing(null);
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تحديث المستخدم", variant: "destructive" }),
  });

  const openEdit = (u) => {
    setEditing(u);
    const permObj = {};
    PERMISSIONS.forEach((p) => { permObj[p.key] = !!u[p.key]; });
    setForm({
      role: u.role || "viewer",
      branch_access: u.branch_access || [],
      permissions: permObj,
    });
  };

  const toggleBranch = (branch) => {
    setForm((f) => ({
      ...f,
      branch_access: f.branch_access.includes(branch)
        ? f.branch_access.filter((b) => b !== branch)
        : [...f.branch_access, branch],
    }));
  };

  const togglePermission = (key) => {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editing.id, payload: { ...form.permissions, role: form.role, branch_access: form.branch_access } });
  };

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">المستخدمين والصلاحيات</h1>
      </div>

      {isLoading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا يوجد مستخدمون</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">البريد الإلكتروني</th>
                  <th className="p-3 font-semibold">الاسم</th>
                  <th className="p-3 font-semibold">الدور</th>
                  <th className="p-3 font-semibold">صلاحية الفروع</th>
                  <th className="p-3 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-gray-700" dir="ltr">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {u.email || "—"}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-800">{u.full_name || "—"}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${ROLE_COLORS[u.role] || ROLE_COLORS.viewer}`}>
                        {u.role === "admin" && <Crown className="w-3 h-3" />}
                        {ROLE_LABELS[u.role] || u.role || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.branch_access || []).length === 0 ? (
                          <span className="text-xs text-gray-400">كل الفروع</span>
                        ) : (
                          (u.branch_access || []).map((b) => (
                            <span key={b} className="text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              {b}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)}>
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogHeader>
          <DialogTitle>تعديل صلاحيات: {editing?.email || ""}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(null)}>✕</Button>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>الدور</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>صلاحية الفروع</Label>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBranch(b)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      form.branch_access.includes(b)
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">اتركها فارغة للسماح بكل الفروع</p>
            </div>

            <div className="space-y-1.5">
              <Label>الصلاحيات</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
                {PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.permissions[p.key]}
                      onChange={() => togglePermission(p.key)}
                      className="w-4 h-4 accent-teal-600"
                    />
                    <span className="text-sm text-gray-700">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
