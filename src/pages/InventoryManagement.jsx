import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PackageX, TrendingDown, Loader2, AlertTriangle, Clock, Building2 } from "lucide-react";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

const STATUS_COLORS = {
  "منتهي": "bg-red-50 text-red-700 border-red-200",
  "قارب الانتهاء": "bg-orange-50 text-orange-700 border-orange-200",
  "راكد": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "بطيء الحركة": "bg-blue-50 text-blue-700 border-blue-200",
};

function ItemTable({ items, isExpired }) {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
        {isExpired ? (
          <AlertTriangle className="w-12 h-12 text-green-300 mx-auto mb-3" />
        ) : (
          <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        )}
        <p className="text-gray-500">
          {isExpired ? "لا توجد أصناف منتهية الصلاحية" : "لا توجد أصناف بطيئة الحركة"}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr className="text-right text-gray-600">
            <th className="p-3 font-semibold">اسم الصنف</th>
            <th className="p-3 font-semibold">الكمية</th>
            <th className="p-3 font-semibold">السعر</th>
            {isExpired && <th className="p-3 font-semibold">تاريخ الانتهاء</th>}
            <th className="p-3 font-semibold">الفرع</th>
            <th className="p-3 font-semibold">الحالة</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-800">{item.item_name || item.name || "—"}</td>
              <td className="p-3 text-gray-600">{item.quantity || 0}</td>
              <td className="p-3 text-gray-600">{(item.price || 0).toLocaleString("ar-EG")} ج</td>
              {isExpired && (
                <td className="p-3 text-gray-600">
                  {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString("ar-EG") : "—"}
                </td>
              )}
              <td className="p-3">
                <span className="flex items-center gap-1 text-gray-600">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  {item.branch || "—"}
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[item.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                  {item.status || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState("expired");

  const { data: expired = [], isLoading: loadingExpired } = useQuery({
    queryKey: ["expired-items"],
    queryFn: () => base44.entities.ExpiredItem.list("expiry_date", 1000),
  });

  const { data: slowMoving = [], isLoading: loadingSlow } = useQuery({
    queryKey: ["slow-moving-items"],
    queryFn: () => base44.entities.SlowMovingItem.list("item_name", 1000),
  });

  const tabs = [
    { key: "expired", label: "الأصناف المنتهية", icon: PackageX, count: expired.length, loading: loadingExpired },
    { key: "slow", label: "الأصناف بطيئة الحركة", icon: TrendingDown, count: slowMoving.length, loading: loadingSlow },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <PackageX className="w-6 h-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800">الراكد والأكسبير</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "expired" ? (
        loadingExpired ? <Spinner /> : (
          <Card className="overflow-hidden">
            <ItemTable items={expired} isExpired={true} />
          </Card>
        )
      ) : (
        loadingSlow ? <Spinner /> : (
          <Card className="overflow-hidden">
            <ItemTable items={slowMoving} isExpired={false} />
          </Card>
        )
      )}
    </div>
  );
}
