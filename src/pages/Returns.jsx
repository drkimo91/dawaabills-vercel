import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { logActivity } from "@/lib/activityLogger";
import { RotateCcw, Loader2, Eye, Filter, Package } from "lucide-react";

const RETURN_STATUSES = ["انتظار", "تم الاستلام", "مرفوض", "تم المعالجة"];

const STATUS_COLORS = {
  "انتظار": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "تم الاستلام": "bg-blue-50 text-blue-700 border-blue-200",
  "مرفوض": "bg-red-50 text-red-700 border-red-200",
  "تم المعالجة": "bg-green-50 text-green-700 border-green-200",
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

export default function Returns() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [detailItem, setDetailItem] = useState(null);

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["returns", statusFilter],
    queryFn: () => {
      if (statusFilter) return base44.entities.Return.filter({ status: statusFilter }, "-created_date");
      return base44.entities.Return.list("-created_date", 1000);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Return.update(id, { status }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["returns"] });
      logActivity({ action_type: "update", entity_type: "return", entity_id: data.id, entity_label: data.return_number });
      toast({ title: "تم التحديث", description: "تم تحديث حالة المرتجع" });
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تحديث المرتجع", variant: "destructive" }),
  });

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">المرتجعات</h1>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">كل الحالات</option>
            {RETURN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : returns.length === 0 ? (
        <Card className="p-12 text-center">
          <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد مرتجعات {statusFilter ? `بحالة "${statusFilter}"` : ""}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">رقم المرتجع</th>
                  <th className="p-3 font-semibold">المورد</th>
                  <th className="p-3 font-semibold">الفرع</th>
                  <th className="p-3 font-semibold">التاريخ</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{r.return_number || "—"}</td>
                    <td className="p-3 text-gray-600">{r.supplier_name || "—"}</td>
                    <td className="p-3 text-gray-600">{r.branch_name || r.branch || "—"}</td>
                    <td className="p-3 text-gray-500">{r.created_date ? new Date(r.created_date).toLocaleDateString("ar-EG") : "—"}</td>
                    <td className="p-3">
                      <select
                        className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[r.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}
                        value={r.status || ""}
                        onChange={(e) => statusMutation.mutate({ id: r.id, status: e.target.value })}
                        disabled={statusMutation.isPending}
                      >
                        <option value="">—</option>
                        {RETURN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDetailItem(r)}>
                        <Eye className="w-4 h-4 text-teal-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(v) => !v && setDetailItem(null)}>
        <DialogHeader>
          <DialogTitle>تفاصيل المرتجع {detailItem?.return_number || ""}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailItem(null)}>✕</Button>
        </DialogHeader>
        <DialogContent className="space-y-4">
          {detailItem && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">المورد:</span> <span className="font-medium">{detailItem.supplier_name || "—"}</span></div>
                <div><span className="text-gray-500">الفرع:</span> <span className="font-medium">{detailItem.branch_name || detailItem.branch || "—"}</span></div>
                <div><span className="text-gray-500">التاريخ:</span> <span className="font-medium">{detailItem.created_date ? new Date(detailItem.created_date).toLocaleDateString("ar-EG") : "—"}</span></div>
                <div><span className="text-gray-500">الحالة:</span> <span className="font-medium">{detailItem.status || "—"}</span></div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Package className="w-4 h-4" /> الأصناف
                </p>
                {(() => {
                  const items = typeof detailItem.items === "object" ? detailItem.items : null;
                  const arr = Array.isArray(items) ? items : items ? [items] : [];
                  if (arr.length === 0) return <p className="text-sm text-gray-400">لا توجد أصناف</p>;
                  return (
                    <div className="space-y-2">
                      {arr.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-gray-800">{item.name || item.medicine_name || `صنف ${idx + 1}`}</span>
                            <span className="text-teal-700 font-semibold">{(item.total || item.price || 0).toLocaleString("ar-EG")} ج</span>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>الكمية: {item.quantity || "—"}</span>
                            <span>السعر: {(item.price || 0).toLocaleString("ar-EG")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
