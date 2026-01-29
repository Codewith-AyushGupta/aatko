'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ClientWorkspace {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface OrgConnection {
  id: number;
  client_id: number;
  alias: string;
  org_id: string | null;
  instance_url: string | null;
  environment: 'production' | 'sandbox' | 'scratch' | 'developer';
  auth_type: 'oauth' | 'jwt' | 'cli';
  is_active: boolean;
  is_default: boolean;
  connection_status: string;
}

interface ClientContextValue {
  // State
  clients: ClientWorkspace[];
  currentClient: ClientWorkspace | null;
  currentOrg: OrgConnection | null;
  orgs: OrgConnection[];
  loading: boolean;
  error: string | null;

  // Actions
  refreshClients: () => Promise<void>;
  selectClient: (clientId: number | null) => Promise<void>;
  selectOrg: (orgId: number | null) => void;
  createClient: (data: { name: string; description?: string }) => Promise<ClientWorkspace>;
  createOrg: (data: {
    alias: string;
    environment: string;
    auth_type: string;
    org_id?: string;
    instance_url?: string;
  }) => Promise<OrgConnection>;
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

const STORAGE_KEY_CLIENT = 'aa-smi-current-client';
const STORAGE_KEY_ORG = 'aa-smi-current-org';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<ClientWorkspace[]>([]);
  const [currentClient, setCurrentClient] = useState<ClientWorkspace | null>(null);
  const [orgs, setOrgs] = useState<OrgConnection[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrgConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients on mount
  const refreshClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/clients');
      if (!res.ok) {
        throw new Error('Failed to load clients');
      }

      const data = await res.json();
      setClients(data.clients || []);

      // Restore selected client from localStorage
      const savedClientId = localStorage.getItem(STORAGE_KEY_CLIENT);
      if (savedClientId) {
        const client = data.clients.find((c: ClientWorkspace) => c.id === parseInt(savedClientId, 10));
        if (client) {
          await loadClientOrgs(client);
        }
      }
    } catch (err: any) {
      console.error('Failed to load clients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orgs for a client
  const loadClientOrgs = async (client: ClientWorkspace) => {
    try {
      const res = await fetch(`/api/clients/${client.id}/orgs`);
      if (!res.ok) {
        throw new Error('Failed to load org connections');
      }

      const data = await res.json();
      setOrgs(data.orgs || []);
      setCurrentClient(client);
      localStorage.setItem(STORAGE_KEY_CLIENT, String(client.id));

      // Restore or select default org
      const savedOrgId = localStorage.getItem(STORAGE_KEY_ORG);
      let selectedOrg: OrgConnection | null = null;

      if (savedOrgId) {
        selectedOrg = data.orgs.find((o: OrgConnection) => o.id === parseInt(savedOrgId, 10)) || null;
      }

      if (!selectedOrg) {
        selectedOrg = data.orgs.find((o: OrgConnection) => o.is_default) || data.orgs[0] || null;
      }

      if (selectedOrg) {
        setCurrentOrg(selectedOrg);
        localStorage.setItem(STORAGE_KEY_ORG, String(selectedOrg.id));
      } else {
        setCurrentOrg(null);
        localStorage.removeItem(STORAGE_KEY_ORG);
      }
    } catch (err: any) {
      console.error('Failed to load orgs:', err);
      setError(err.message);
    }
  };

  // Select a client
  const selectClient = useCallback(async (clientId: number | null) => {
    if (clientId === null) {
      setCurrentClient(null);
      setOrgs([]);
      setCurrentOrg(null);
      localStorage.removeItem(STORAGE_KEY_CLIENT);
      localStorage.removeItem(STORAGE_KEY_ORG);
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (client) {
      await loadClientOrgs(client);
    }
  }, [clients]);

  // Select an org
  const selectOrg = useCallback((orgId: number | null) => {
    if (orgId === null) {
      setCurrentOrg(null);
      localStorage.removeItem(STORAGE_KEY_ORG);
      return;
    }

    const org = orgs.find(o => o.id === orgId);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem(STORAGE_KEY_ORG, String(org.id));
    }
  }, [orgs]);

  // Create a new client
  const createClient = useCallback(async (data: { name: string; description?: string }): Promise<ClientWorkspace> => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create client');
    }

    const result = await res.json();
    await refreshClients();
    return result.client;
  }, [refreshClients]);

  // Create a new org connection
  const createOrg = useCallback(async (data: {
    alias: string;
    environment: string;
    auth_type: string;
    org_id?: string;
    instance_url?: string;
  }): Promise<OrgConnection> => {
    if (!currentClient) {
      throw new Error('No client selected');
    }

    const res = await fetch(`/api/clients/${currentClient.id}/orgs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create org connection');
    }

    const result = await res.json();

    // Refresh orgs
    await loadClientOrgs(currentClient);

    return result.org;
  }, [currentClient]);

  // Initial load
  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const value: ClientContextValue = {
    clients,
    currentClient,
    currentOrg,
    orgs,
    loading,
    error,
    refreshClients,
    selectClient,
    selectOrg,
    createClient,
    createOrg,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
