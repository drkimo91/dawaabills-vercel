import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { HandCoins, Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

export default function SupplierBalances() {
  const { data: suppliers = [], isLoading: ls } = useQuery({
    queryKey: ["bal-suppliers"],
    queryFn: () => base44.entities.Supplier.list("name"),
  });
  const { data: debts = [], isLoading: ld } = useQuery({
    queryKey: ["supplier-debts"],
    queryFn: () => base44.entities.SupplierDebt.list("-created_date", 2000),
  });
  const { data: payments = [], isLoading: lp } = useQuery({
    queryKey: ["supplier-payments"],
    queryFn: () => base44.entities.SupplierPayment.list("-created_date", 2000),
  });
  const { data: invoices = [], isLoading: li } = useQuery({
    queryKey: ["bal-invoices"],
    queryFn: () => base44.entities.PurchaseInvoice.list("-created_date", 2000),
  });
  const { data: monthStarts = [], isLoading: lm } = useQuery({
    queryKey: ["supplier-month-starts"],
    queryFn: () => base44.entities.SupplierMonthStart.list("-created_date", 2000),
  });

  const isLoading = ls || ld || lp || li || lm;

  const balances = useMemo(() => {
    return suppliers.map((supplier) => {
      const supplierId = supplier.id;
      const supplierName = supplier.name;

      // initial debt from supplier_debts or month_starts
      const initialDebt = debts
        .filter((d) => d.supplier_id === supplierId || d.supplier_name === supplierName)
        .reduce((s, d) => s + (d.amount || d.initial_debt || 0), 0);

      const monthStartDebt = monthStarts
        .filter((m) => m.supplier_id === supplierId || m.supplier_name === supplierName)
        .reduce((s, m) => s + (m.opening_balance || m.initial_debt || 0), 0);

      // sum of invoices (آجل only adds to balance)
      const invoiceTotal = invoices
        .filter((i) => i.supplier_id === supplierId || i.supplier_name === supplierName)
        .reduce((s, i) => s + (i.total_value || 0), 0);

      // sum of payments
      const paymentTotal = payments
        .filter((p) => p.supplier_id === supplierId || p.supplier_name === supplierName)
        .reduce((s, p) => s + (p.amount || 0), 0);

      const balance = initialDebt + monthStartDebt + invoiceTotal - paymentTotal;

      return {
        supplierName,
        initialDebt: initialDebt + monthStartDebt,
        invoiceTotal,
        paymentTotal,
        balance,
      };
    }).sort((a, b) => b.balance - a.balance);
  }, [suppliers, debts, monthStarts, invoices, payments]);

  const totalBalance = balances.reduce((s, b) => s + b.balance, 0);

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <HandCoins className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">أرصدة الموردين</h1>
      </div>

      {isLoading ? (
        <Spinner />
      ) : balances.length === 0 ? (
        <Card className="p-12 text-center">
          <HandCoins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا يوجد موردين</p>
        </Card>
      ) : (
        <>
          <Card className="p-4 bg-teal-50/50 border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-700">إجمالي الأرصدة المستحقة</p>
                <p className="text-2xl font-bold text-teal-800">{totalBalance.toLocaleString("ar-EG")} ج</p>
              </div>
              <HandCoins className="w-10 h-10 text-teal-400" />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-right text-gray-600">
                    <th className="p-3 font-semibold">المورد</th>
                    <th className="p-3 font-semibold">رصيد افتتاحي</th>
                    <th className="p-3 font-semibold">إجمالي الفواتير</th>
                    <th className="p-3 font-semibold">إجمالي المدفوعات</th>
                    <th className="p-3 font-semibold">الرصيد الحالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {balances.map((b, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{b.supplierName}</td>
                      <td className="p-3 text-gray-600">{b.initialDebt.toLocaleString("ar-EG")} ج</td>
                      <td className="p-3 text-gray-600">{b.invoiceTotal.toLocaleString("ar-EG")} ج</td>
                      <td className="p-3 text-green-600">{b.paymentTotal.toLocaleString("ar-EG")} ج</td>
                      <td className="p-3">
                        <span className={`font-bold flex items-center gap-1 ${b.balance > 0 ? "text-red-600" : b.balance < 0 ? "text-green-600" : "text-gray-600"}`}>
                          {b.balance > 0 ? <TrendingDown className="w-4 h-4" /> : b.balance < 0 ? <TrendingUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                          {Math.abs(b.balance).toLocaleString("ar-EG")} ج
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
