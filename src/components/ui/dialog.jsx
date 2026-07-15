import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Dialog = forwardRef(({ open, onOpenChange, children }, ref) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => onOpenChange(false)} />
      <div ref={ref} className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-xl shadow-2xl animate-scale-in mx-4">
        {children}
      </div>
    </div>
  );
});
Dialog.displayName = "Dialog";

const DialogHeader = ({ children }) => (
  <div className="flex items-center justify-between p-4 border-b">{children}</div>
);

const DialogTitle = forwardRef(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

const DialogContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
DialogContent.displayName = "DialogContent";

const DialogFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center justify-end gap-2 p-4 border-t", className)} {...props} />
));
DialogFooter.displayName = "DialogFooter";

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter };
