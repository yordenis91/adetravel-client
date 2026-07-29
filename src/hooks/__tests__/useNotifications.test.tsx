import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNotifications } from "../useNotifications";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function Wrapper({ client, children }: { client: QueryClient; children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function NotificationsTestComponent() {
  const { notifications, unreadCount, totalCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div>
      <div>Unread: {unreadCount}</div>
      <div>Total: {totalCount}</div>
      <button onClick={() => markAllAsRead()}>Mark All</button>
      {notifications.map((notification) => (
        <div key={notification.id}>
          <span>{notification.title}</span>
          <span>{notification.message}</span>
          <button onClick={() => markAsRead(notification.id)}>Mark Read</button>
        </div>
      ))}
    </div>
  );
}

describe("useNotifications hook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads notifications and exposes unreadCount and totalCount", async () => {
    const notificationsResponse = {
      data: [
        { id: "1", title: "Pago Recibido", message: "Pago completado", isRead: false, createdAt: "2026-07-29T00:00:00.000Z", userId: "user-1" },
      ],
      unreadCount: 1,
      total: 1,
    };

    const statsResponse = {
      data: { data: { unreadCount: 1, totalCount: 1 } },
    };

    vi.spyOn(api, "get").mockImplementation((path: string) => {
      if (path === "/notifications") {
        return Promise.resolve(notificationsResponse) as any;
      }
      if (path === "/notifications/stats") {
        return Promise.resolve(statsResponse) as any;
      }
      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    const client = createQueryClient();

    render(
      <Wrapper client={client}>
        <NotificationsTestComponent />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Unread: 1")).toBeInTheDocument();
      expect(screen.getByText("Total: 1")).toBeInTheDocument();
      expect(screen.getByText("Pago Recibido")).toBeInTheDocument();
      expect(screen.getByText("Pago completado")).toBeInTheDocument();
    });
  });

  it("calls api.patch when marking a notification as read", async () => {
    const notificationsResponse = {
      data: [
        { id: "1", title: "Pago Recibido", message: "Pago completado", isRead: false, createdAt: "2026-07-29T00:00:00.000Z", userId: "user-1" },
      ],
      unreadCount: 1,
      total: 1,
    };

    const statsResponse = {
      data: { data: { unreadCount: 1, totalCount: 1 } },
    };

    const patchSpy = vi.spyOn(api, "patch").mockResolvedValue({ data: { ok: true } } as any);
    vi.spyOn(api, "get").mockImplementation((path: string) => {
      if (path === "/notifications") {
        return Promise.resolve(notificationsResponse) as any;
      }
      if (path === "/notifications/stats") {
        return Promise.resolve(statsResponse) as any;
      }
      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    const client = createQueryClient();

    render(
      <Wrapper client={client}>
        <NotificationsTestComponent />
      </Wrapper>
    );

    const button = await screen.findByText("Mark Read");
    fireEvent.click(button);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith("/notifications/1/read");
    });
  });

  it("calls api.patch when marking all notifications as read", async () => {
    const notificationsResponse = {
      data: [
        { id: "1", title: "Pago Recibido", message: "Pago completado", isRead: false, createdAt: "2026-07-29T00:00:00.000Z", userId: "user-1" },
      ],
      unreadCount: 1,
      total: 1,
    };

    const statsResponse = {
      data: { data: { unreadCount: 1, totalCount: 1 } },
    };

    const patchSpy = vi.spyOn(api, "patch").mockResolvedValue({ data: { ok: true } } as any);
    vi.spyOn(api, "get").mockImplementation((path: string) => {
      if (path === "/notifications") {
        return Promise.resolve(notificationsResponse) as any;
      }
      if (path === "/notifications/stats") {
        return Promise.resolve(statsResponse) as any;
      }
      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    const client = createQueryClient();

    render(
      <Wrapper client={client}>
        <NotificationsTestComponent />
      </Wrapper>
    );

    const button = await screen.findByText("Mark All");
    fireEvent.click(button);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith("/notifications/read-all");
    });
  });
});
