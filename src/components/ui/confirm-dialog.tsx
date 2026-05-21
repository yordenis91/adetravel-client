import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "warning",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
        <div className="p-6 pt-8 flex flex-col items-center text-center">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-6",
              isDanger ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
            )}
          >
            {isDanger ? (
              <ShieldAlert className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>

          <AlertDialogHeader className="space-y-2 mb-6">
            <AlertDialogTitle className="text-2xl font-playfair font-bold text-navy text-center">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed text-center px-2">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="w-full flex flex-col sm:flex-row gap-3 sm:gap-2">
            <AlertDialogCancel
              disabled={isLoading}
              className="flex-1 rounded-xl h-12 border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] hover:bg-slate-50 hover:text-navy transition-colors mt-0"
            >
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              className={cn(
                "flex-1 rounded-xl h-12 font-bold uppercase tracking-wider text-[10px] shadow-lg transition-all active:scale-[0.98] border-none",
                isDanger
                  ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200"
                  : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200 text-white"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                confirmLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}