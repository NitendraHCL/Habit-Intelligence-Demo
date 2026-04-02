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
  id: "cmjvk37rk000060s92ezzeg1r",
  name: "HCL Healthcare",
  cugCode: "HCLT001",
};

const allClients: ClientInfo[] = [
  { id: "cmjvk37rk000060s92ezzeg1r", name: "HCL Healthcare", cugCode: "HCLT001" },
  { id: "cmjvk37rl000160s9l4hs4zvf", name: "JPMC", cugCode: "JPMC002" },
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
