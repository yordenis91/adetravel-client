import { api } from "@/lib/api";

export async function logActivity(params: {
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  description: string;
  performedBy?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await api.post('/activity-logs', {
      ...params,
      performedBy: params.performedBy ?? "Sistema",
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    });
  } catch (e) {
    // Logging should never break the main action
    console.error("Error registering activity log:", e);
  }
}
