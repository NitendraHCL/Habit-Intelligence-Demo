"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ClientInfo {
  id: string;
  name: string;
  cugCode: string;
}

interface ClientContextType {
  client: ClientInfo;
  setClient: (client: ClientInfo) => void;
  clients: ClientInfo[];
}

const defaultClient: ClientInfo = {
  id: "cisco-001",
  name: "CISCO",
  cugCode: "CISCO",
};

const allClients: ClientInfo[] = [
  { id: "cisco-001", name: "CISCO", cugCode: "CISCO" },
  { id: "hcltech-001", name: "HCL Tech", cugCode: "HCLTECH" },
];

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [client, setClientState] = useState<ClientInfo>(defaultClient);

  const setClient = useCallback((c: ClientInfo) => {
    setClientState(c);
  }, []);

  return (
    <ClientContext.Provider value={{ client, setClient, clients: allClients }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClient must be used within ClientProvider");
  return context;
}
