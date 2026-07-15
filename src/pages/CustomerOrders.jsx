import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { logActivity } from "@/lib/activityLogger";
import { ShoppingBag, Loader2, Filter, Phone, Package, Flag, Building2 } from "lucide-react";

const ORDER_STATUSES = ["جديد", "قيد التنفيذ", "تم التسليم", "ملغي"];
const PRIORITY_LABELS = { high: "عالية", medium: "متوسطة", low: "منخفضة" };
const PRIORITY_COLORS = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-green-50 text-green-700 border-green-200",
};
const STATUS_COLORS = {
  "جديد": "bg-blue-50 text-blue-700 border-blue-200",
  "قيد التنفيذ": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "تم التسليم": "bg-green-50 text-green-700 border-green-200",
  "ملغي": "bg-red-50 text-red-700 border-red-200",
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

export default function CustomerOrders() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer-orders", statusFilter],
    queryFn: () => {
      if (statusFilter) return base44.entities.CustomerOrder.filter({ status: statusFilter }, "-created_date");
      return base44.entities.CustomerOrder.list("-created_date", 1000);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.CustomerOrder.update(id, { status }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["customer-orders"] });
      logActivity({ action_type: "update", entity_type: "customer_order", entity_id: data.id, entity_label: data.order_number });
      toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب" });
    },
    onError: () => toast({ title: "خطأ", description: "تعذّر تحديث الطلب", variant: "destructive" }),
  });

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">طلبات العملاء</h1>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">كل الحالات</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد طلبات {statusFilter ? `بحالة "${statusFilter}"` : ""}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-right text-gray-600">
                  <th className="p-3 font-semibold">رقم الطلب</th>
                  <th className="p-3 font-semibold">العميل</th>
                  <th className="p-3 font-semibold">الهاتف</th>
                  <th className="p-3 font-semibold">المنتج</th>
                  <th className="p-3 font-semibold">الفرع</th>
                  <th className="p-3 font-semibold">الأولوية</th>
                  <th className="p-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{o.order_number || "—"}</td>
                    <td className="p-3 text-gray-700">{o.customer_name || "—"}</td>
                    <td className="p-3 text-gray-600" dir="ltr">{o.phone || "—"}</td>
                    <td className="p-3 text-gray-600">{o.product_name || "—"}</td>
                    <td className="p-3 text-gray-600">{o.branch || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${PRIORITY_COLORS[o.priority] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {PRIORITY_LABELS[o.priority] || o.priority || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[o.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}
                        value={o.status || ""}
                        onChange={(e) => statusMutation.mutate({ id: o.id, status: e.target.value })}
                        disabled={statusMutation.isPending}
                      >
                        <option value="">—</option>
                        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
