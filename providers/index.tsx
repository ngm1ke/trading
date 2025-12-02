"use client";
import { wsService } from "@/services/ws";
import { batchSocketUpdate, store } from "@/store";
import { setConnectionStatus } from "@/store/uiSlice";
import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    wsService.connect();
    // Update status in ui slice
    wsService.setStatusCallback((status) => {
      store.dispatch(setConnectionStatus(status));
    });

    let animationFrameId: number;

    const tick = () => {
      if (wsService.hasData()) {
        const data = wsService.flush();
        store.dispatch(batchSocketUpdate(data));
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrameId);
      wsService.disconnect();
    };
  }, []);
  return <Provider store={store}>{children}</Provider>;
}
