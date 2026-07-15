import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart2, Loader2, Download, Calendar, FileText, Receipt, Building2, Users, TrendingUp } from "lucide-react";

const BRANCHES = ["فرع زكريا", "فرع بسيسة", "فرع المنشية"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const today = new Date().toISOString().split("T")[0];
const firstOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const { data: invoices = [], isLoading: li } = useQuery({
    queryKey: ["rep-invoices"],
    queryFn: () => base44.entities.PurchaseInvoice.list("-created_date", 5000),
  });
  const { data: expenses = [], isLoading: le } = useQuery({
    queryKey: ["rep-expenses"],
    queryFn: () => base44.entities.Expense.list("-created_date", 5000),
  });

  const isLoading = li || le;

  const inDateRange = (item) => {
    const d = item.invoice_date || item.date || (item.created_date || "").split("T")[0];
    return d && d >= dateFrom && d <= dateTo;
  };

  const rangeInvoices = invoices.filter(inDateRange);
  const rangeExpenses = expenses.filter(inDateRange);

  const totalInvoices = rangeInvoices.reduce((s, i) => s + (i.total_value || 0), 0);
  const totalExpenses = rangeExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const byBranch = BRANCHES.map((branch) => ({
    branch,
    invoices: rangeInvoices.filter((i) => i.branch === branch).reduce((s, i) => s + (i.total_value || 0), 0),
    invoiceCount: rangeInvoices.filter((i) => i.branch === branch).length,
    expenses: rangeExpenses.filter((e) => e.branch === branch).reduce((s, e) => s + (e.amount || 0), 0),
  }));

  const supplierMap = new Map();
  rangeInvoices.forEach((i) => {
    const name = i.supplier_name || "غير محدد";
    supplierMap.set(name, (supplierMap.get(name) || 0) + (i.total_value || 0));
  });
  const bySupplier = Array.from(supplierMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const handleExport = () => {
    const rows = [
      ["النوع", "الوصف", "الفرع", "المورد/الفئة", "المبلغ", "التاريخ"],
      ...rangeInvoices.map((i) => ["فاتورة", i.system_invoice_number || "", i.branch || "", i.supplier_name || "", i.total_value || 0, i.invoice_date || ""]),
      ...rangeExpenses.map((e) => ["مصروف", e.description || "", e.branch || "", e.category || "", e.amount || 0, e.date || ""]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxBranchVal = Math.max(...byBranch.map((b) => Math.max(b.invoices, b.expenses)), 1);

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={handleExport} disabled={isLoading}>
          <Download className="w-4 h-4" /> تصدير CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> من تاريخ</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-auto" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> إلى تاريخ</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-auto" />
          </div>
          <p className="text-xs text-gray-400 pb-2">الفترة: {dateFrom} ← {dateTo}</p>
        </div>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-3 bg-teal-50/50 border-teal-200">
              <div className="p-2 rounded-lg bg-teal-100 shrink-0"><FileText className="w-5 h-5 text-teal-600" /></div>
              <div>
                <p className="text-xs text-gray-500">إجمالي الفواتير</p>
                <p className="text-xl font-bold text-gray-800">{totalInvoices.toLocaleString("ar-EG")} ج</p>
                <p className="text-xs text-gray-400">{rangeInvoices.length} فاتورة</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3 bg-orange-50/50 border-orange-200">
              <div className="p-2 rounded-lg bg-orange-100 shrink-0"><Receipt className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-gray-500">إجمالي المصروفات</p>
                <p className="text-xl font-bold text-gray-800">{totalExpenses.toLocaleString("ar-EG")} ج</p>
                <p className="text-xs text-gray-400">{rangeExpenses.length} مصروف</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3 bg-blue-50/50 border-blue-200">
              <div className="p-2 rounded-lg bg-blue-100 shrink-0"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500">الإجمالي العام</p>
                <p className="text-xl font-bold text-gray-800">{(totalInvoices + totalExpenses).toLocaleString("ar-EG")} ج</p>
              </div>
            </Card>
          </div>

          {/* By Branch */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-600" /> ملخص الفروع</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {byBranch.map((b) => (
                <div key={b.branch} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{b.branch}</span>
                    <span className="text-gray-500">{b.invoiceCount} فاتورة</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div className="absolute inset-y-0 right-0 bg-teal-500 rounded-lg flex items-center px-2" style={{ width: `${(b.invoices / maxBranchVal) * 100}%` }}>
                        <span className="text-xs text-white font-medium">{b.invoices.toLocaleString("ar-EG")} ج</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative h-4 bg-gray-100 rounded-lg overflow-hidden">
                      <div className="absolute inset-y-0 right-0 bg-orange-400 rounded-lg" style={{ width: `${(b.expenses / maxBranchVal) * 100}%` }} />
                    </div>
                    <span className="text-xs text-orange-600 font-medium w-28 text-left">{b.expenses.toLocaleString("ar-EG")} ج</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* By Supplier */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-teal-600" /> أعلى الموردين</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bySupplier.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">لا توجد بيانات</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-right text-gray-600">
                      <th className="p-3 font-semibold">المورد</th>
                      <th className="p-3 font-semibold">إجمالي المشتريات</th>
                      <th className="p-3 font-semibold">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bySupplier.map((s, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{s.name}</td>
                        <td className="p-3 font-semibold text-teal-700">{s.total.toLocaleString("ar-EG")} ج</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-1.5 bg-teal-500 rounded-full" style={{ width: `${totalInvoices > 0 ? (s.total / totalInvoices) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{totalInvoices > 0 ? Math.round((s.total / totalInvoices) * 100) : 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
