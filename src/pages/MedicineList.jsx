import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FlaskConical, Loader2, Calendar, Building2 } from "lucide-react";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

function getWeekLabel(dateStr) {
  if (!dateStr) return "غير محدد";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = (d - start) / 86400000;
  const weekNum = Math.ceil((diff + start.getDay() + 1) / 7);
  return `أسبوع ${weekNum} - ${year}`;
}

function getWeekKey(dateStr) {
  if (!dateStr) return "unknown";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = (d - start) / 86400000;
  const weekNum = Math.ceil((diff + start.getDay() + 1) / 7);
  return `${year}-W${weekNum}`;
}

export default function MedicineList() {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["medicine-sales"],
    queryFn: () => base44.entities.MedicineSale.list("-created_date", 2000),
  });

  const grouped = useMemo(() => {
    const map = new Map();
    for (const sale of sales) {
      const dateStr = sale.created_date || sale.invoice_date || sale.date;
      const weekKey = getWeekKey(dateStr);
      const weekLabel = getWeekLabel(dateStr);
      if (!map.has(weekKey)) {
        map.set(weekKey, { weekKey, weekLabel, items: [] });
      }
      map.get(weekKey).items.push(sale);
    }
    return Array.from(map.values()).sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  }, [sales]);

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">أدوية اللسته</h1>
      </div>

      {isLoading ? (
        <Spinner />
      ) : grouped.length === 0 ? (
        <Card className="p-12 text-center">
          <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد بيانات مبيعات أدوية</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <Card key={group.weekKey} className="overflow-hidden">
              <CardHeader className="bg-teal-50/50 border-b py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <CardTitle className="text-base">{group.weekLabel}</CardTitle>
                  <span className="text-xs text-gray-500 mr-2">({group.items.length} سجل)</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr className="text-right text-gray-600">
                        <th className="p-2.5 font-semibold">الفرع</th>
                        <th className="p-2.5 font-semibold">اسم الدواء</th>
                        <th className="p-2.5 font-semibold">الكمية</th>
                        <th className="p-2.5 font-semibold">السعر</th>
                        <th className="p-2.5 font-semibold">الإجمالي</th>
                        <th className="p-2.5 font-semibold">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {group.items.map((sale) => {
                        const saleData = typeof sale.sales === "object" ? sale.sales : null;
                        const items = saleData?.items || saleData?.medicines || [];
                        return (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="p-2.5">
                              <span className="flex items-center gap-1 text-gray-700">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                {sale.branch || "—"}
                              </span>
                            </td>
                            <td className="p-2.5 text-gray-700">
                              {saleData?.name || saleData?.medicine_name || items[0]?.name || "—"}
                            </td>
                            <td className="p-2.5 text-gray-600">
                              {saleData?.quantity || items[0]?.quantity || "—"}
                            </td>
                            <td className="p-2.5 text-gray-600">
                              {(saleData?.price || items[0]?.price || 0).toLocaleString("ar-EG")}
                            </td>
                            <td className="p-2.5 font-semibold text-teal-700">
                              {(saleData?.total || sale.total_value || 0).toLocaleString("ar-EG")} ج
                            </td>
                            <td className="p-2.5 text-gray-500 text-xs">
                              {(sale.created_date || sale.invoice_date || "").split("T")[0]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
