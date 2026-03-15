import React, { createContext, useCallback, useContext, useState } from "react";

interface StatusContextValue {
  status: string;
  setStatus: (message: string) => void;
  clearStatus: () => void;
}

const StatusContext = createContext<StatusContextValue | null>(null);

const DEFAULT_STATUS = "Ready";

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState(DEFAULT_STATUS);
  const setStatus = useCallback((message: string) => {
    setStatusState(typeof message === "string" && message.trim() ? message.trim() : DEFAULT_STATUS);
  }, []);
  const clearStatus = useCallback(() => {
    setStatusState(DEFAULT_STATUS);
  }, []);
  return (
    <StatusContext.Provider value={{ status, setStatus, clearStatus }}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus(): StatusContextValue {
  const ctx = useContext(StatusContext);
  if (!ctx) {
    return {
      status: DEFAULT_STATUS,
      setStatus: () => {},
      clearStatus: () => {},
    };
  }
  return ctx;
}
