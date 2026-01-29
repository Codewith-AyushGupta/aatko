'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ClientWorkspace {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface OrgConnection {
  id: number;
  alias: string;
  environment: string;
  auth_type: string;
  is_active: boolean;
  is_default: boolean;
  connection_status: string;
}

export default function ClientsAdminPage() {
  const [clients, setClients] = useState<ClientWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New client form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDescription, setNewClientDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Client details
  const [selectedClient, setSelectedClient] = useState<ClientWorkspace | null>(null);
  const [clientOrgs, setClientOrgs] = useState<OrgConnection[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // New org form
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [newOrgAlias, setNewOrgAlias] = useState('');
  const [newOrgEnvironment, setNewOrgEnvironment] = useState('sandbox');
  const [newOrgAuthType, setNewOrgAuthType] = useState('cli');
  const [creatingOrg, setCreatingOrg] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      const res = await fetch('/api/clients?includeInactive=true');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createClient() {
    if (!newClientName.trim()) return;

    try {
      setCreating(true);
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          description: newClientDescription || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create client');
      }

      setNewClientName('');
      setNewClientDescription('');
      setShowNewClientForm(false);
      await loadClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function loadClientOrgs(client: ClientWorkspace) {
    setSelectedClient(client);
    setLoadingOrgs(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/orgs?includeInactive=true`);
      const data = await res.json();
      setClientOrgs(data.orgs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingOrgs(false);
    }
  }

  async function createOrg() {
    if (!selectedClient || !newOrgAlias.trim()) return;

    try {
      setCreatingOrg(true);
      const res = await fetch(`/api/clients/${selectedClient.id}/orgs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: newOrgAlias,
          environment: newOrgEnvironment,
          auth_type: newOrgAuthType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create org connection');
      }

      setNewOrgAlias('');
      setShowNewOrgForm(false);
      await loadClientOrgs(selectedClient);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingOrg(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const getEnvBadgeColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-red-100 text-red-700';
      case 'sandbox':
        return 'bg-yellow-100 text-yellow-700';
      case 'scratch':
        return 'bg-blue-100 text-blue-700';
      case 'developer':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'refreshing':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage client workspaces and Salesforce org connections</p>
        </div>
        <button
          onClick={() => setShowNewClientForm(true)}
          className="px-4 py-2 bg-acs-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Client
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {/* New Client Form */}
      {showNewClientForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Client</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acs-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newClientDescription}
                onChange={(e) => setNewClientDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acs-blue focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createClient}
                disabled={creating || !newClientName.trim()}
                className="px-4 py-2 bg-acs-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Client'}
              </button>
              <button
                onClick={() => setShowNewClientForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-700">Clients ({clients.length})</h2>
          </div>
          {clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No clients yet. Create your first client to get started.
            </div>
          ) : (
            <div className="divide-y">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => loadClientOrgs(client)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedClient?.id === client.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.slug}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!client.is_active && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          Inactive
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDate(client.created_at)}
                      </span>
                    </div>
                  </div>
                  {client.description && (
                    <div className="text-sm text-gray-500 mt-1 truncate">
                      {client.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Org Connections */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">
              {selectedClient ? `Org Connections - ${selectedClient.name}` : 'Select a Client'}
            </h2>
            {selectedClient && (
              <button
                onClick={() => setShowNewOrgForm(true)}
                className="text-sm px-3 py-1 bg-acs-blue text-white rounded hover:bg-blue-700 transition-colors"
              >
                + Add Org
              </button>
            )}
          </div>

          {!selectedClient ? (
            <div className="p-8 text-center text-gray-500">
              Select a client to view org connections
            </div>
          ) : loadingOrgs ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-4 border-acs-blue border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <>
              {/* New Org Form */}
              {showNewOrgForm && (
                <div className="p-4 border-b bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alias *
                      </label>
                      <input
                        type="text"
                        value={newOrgAlias}
                        onChange={(e) => setNewOrgAlias(e.target.value)}
                        placeholder="e.g., acme-prod, acme-sandbox"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-acs-blue focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Environment
                        </label>
                        <select
                          value={newOrgEnvironment}
                          onChange={(e) => setNewOrgEnvironment(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-acs-blue focus:border-transparent text-sm"
                        >
                          <option value="production">Production</option>
                          <option value="sandbox">Sandbox</option>
                          <option value="scratch">Scratch</option>
                          <option value="developer">Developer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auth Type
                        </label>
                        <select
                          value={newOrgAuthType}
                          onChange={(e) => setNewOrgAuthType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-acs-blue focus:border-transparent text-sm"
                        >
                          <option value="cli">CLI (sf command)</option>
                          <option value="oauth">OAuth</option>
                          <option value="jwt">JWT Bearer</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={createOrg}
                        disabled={creatingOrg || !newOrgAlias.trim()}
                        className="px-3 py-1.5 text-sm bg-acs-blue text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {creatingOrg ? 'Creating...' : 'Add Org'}
                      </button>
                      <button
                        onClick={() => setShowNewOrgForm(false)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {clientOrgs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No org connections yet. Add a Salesforce org to start syncing.
                </div>
              ) : (
                <div className="divide-y">
                  {clientOrgs.map((org) => (
                    <div key={org.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{org.alias}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${getEnvBadgeColor(org.environment)}`}>
                            {org.environment}
                          </span>
                          {org.is_default && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${getStatusBadgeColor(org.connection_status)}`}>
                            {org.connection_status}
                          </span>
                          {!org.is_active && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Auth: {org.auth_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
