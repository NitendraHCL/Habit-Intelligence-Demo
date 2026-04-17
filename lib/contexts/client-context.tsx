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
  name: "HCL Healthcare",
  cugCode: "HCLHEALTHCARE",
};

const allClients: ClientInfo[] = [
  { id: "cisco-001", name: "HCL Healthcare", cugCode: "HCLHEALTHCARE" },
  { id: "hcltech-001", name: "Demo Client", cugCode: "DUMMY01" },
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
