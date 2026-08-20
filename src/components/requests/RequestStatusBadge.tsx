import React from "react";
import { cn } from "@/lib/utils";
import { getStatusColor, getStatusLabel } from "@/lib/workflow-status";

interface RequestStatusBadgeProps {
  status: string;
  className?: string;
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
      color.bg,
      color.text,
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", color.dot)} />
      {label}
    </span>
  );
}
