import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PageNotFound() {
  return (
    <div className="p-4 md:p-6 space-y-4 min-h-[70vh] flex items-center justify-center" dir="rtl">
      <Card className="max-w-md w-full p-8 text-center space-y-4 border-teal-100">
        <div className="w-16 h-16 mx-auto rounded-full bg-teal-50 flex items-center justify-center">
          <Compass className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-5xl font-bold text-teal-600">404</h1>
        <p className="text-lg font-semibold text-gray-800">الصفحة غير موجودة</p>
        <p className="text-sm text-gray-500">عذراً، الصفحة التي تبحث عنها غير متاحة أو تم نقلها إلى موقع آخر.</p>
        <Link to="/dashboard">
          <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
            <Home className="w-4 h-4" />
            العودة إلى الصفحة الرئيسية
          </Button>
        </Link>
      </Card>
    </div>
  );
}
