'use client';

import { useState, useEffect } from 'react';

interface SyncRecord {
  success: boolean;
  timestamp: string;
  metadataRetrieved: number;
  nodesUpdated: number;
  edgesUpdated: number;
  errors: string[];
}

interface OrgInfo {
  alias: string;
  username: string;
  instanceUrl: string;
  connectedStatus: string;
  isSandbox?: boolean;
  orgType?: string;
}

interface SyncProgress {
  stage: string;
  progress: number;
  message: string;
}

export default function SettingsPage() {
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([]);
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [selectedOrg, setSelectedOrg] = useState('aa-sandbox');
  const [activeTab, setActiveTab] = useState<'sync' | 'orgs' | 'security' | 'about'>('sync');
  const [removingOrg, setRemovingOrg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyRes, orgsRes] = await Promise.all([
        fetch('/api/settings/sync-history'),
        fetch('/api/settings/orgs'),
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        setSyncHistory(data.history || []);
      }

      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrgs(data.orgs || []);
        if (data.orgs?.length > 0 && !selectedOrg) {
          setSelectedOrg(data.orgs[0].alias);
        }
      }
    } catch (error) {
      console.error('Failed to load settings data:', error);
    }
    setLoading(false);
  };

  const runSync = async (type: 'full' | 'utilization' | 'record-counts') => {
    setSyncing(true);
    setSyncProgress({ stage: 'Starting', progress: 0, message: 'Initializing sync...' });

    // Simulate progress stages
    const progressStages = [
      { stage: 'Connecting', progress: 10, message: 'Connecting to Salesforce...' },
      { stage: 'Retrieving', progress: 30, message: 'Retrieving metadata...' },
      { stage: 'Processing', progress: 60, message: 'Processing metadata...' },
      { stage: 'Saving', progress: 85, message: 'Saving to database...' },
    ];

    let stageIndex = 0;
    const progressInterval = setInterval(() => {
      if (stageIndex < progressStages.length) {
        setSyncProgress(progressStages[stageIndex]);
        stageIndex++;
      }
    }, 2000);

    try {
      const res = await fetch('/api/settings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, org: selectedOrg }),
      });

      clearInterval(progressInterval);

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setSyncProgress({ stage: 'Complete', progress: 100, message: 'Sync completed successfully!' });
          setTimeout(() => {
            setSyncProgress(null);
            loadData();
          }, 2000);
        } else {
          setSyncProgress({ stage: 'Failed', progress: 100, message: result.errors?.join(', ') || 'Unknown error' });
          setTimeout(() => setSyncProgress(null), 5000);
        }
      } else {
        setSyncProgress({ stage: 'Failed', progress: 100, message: 'Sync request failed' });
        setTimeout(() => setSyncProgress(null), 5000);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setSyncProgress({ stage: 'Failed', progress: 100, message: String(error) });
      setTimeout(() => setSyncProgress(null), 5000);
    }
    setSyncing(false);
  };

  const removeOrg = async (alias: string) => {
    if (!confirm(`Are you sure you want to disconnect "${alias}"?\n\nYou can reconnect later using the Salesforce CLI.`)) {
      return;
    }

    setRemovingOrg(alias);
    try {
      const res = await fetch('/api/settings/orgs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias }),
      });

      if (res.ok) {
        loadData();
      } else {
        const data = await res.json();
        alert(`Failed to remove org: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to remove org: ' + error);
    }
    setRemovingOrg(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage sync, connections, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'sync', label: 'Sync & Data' },
            { id: 'orgs', label: 'Connected Orgs' },
            { id: 'security', label: 'Security' },
            { id: 'about', label: 'About' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-sf-blue text-sf-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* Sync Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Sync Actions</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Org</label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue"
              >
                {orgs.map((org) => (
                  <option key={org.alias} value={org.alias}>
                    {org.alias} ({org.username})
                  </option>
                ))}
                {orgs.length === 0 && (
                  <option value="">No orgs connected</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SyncCard
                title="Full Metadata Sync"
                description="Pull all metadata from Salesforce and rebuild the database"
                icon="🔄"
                onClick={() => runSync('full')}
                disabled={syncing || orgs.length === 0}
                loading={syncing}
              />
              <SyncCard
                title="Field Utilization"
                description="Analyze field population rates (run against production)"
                icon="📊"
                onClick={() => runSync('utilization')}
                disabled={syncing || orgs.length === 0}
                loading={syncing}
              />
              <SyncCard
                title="Record Counts"
                description="Fetch record counts for all objects"
                icon="🔢"
                onClick={() => runSync('record-counts')}
                disabled={syncing || orgs.length === 0}
                loading={syncing}
              />
            </div>

            {/* Progress Bar */}
            {syncProgress && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{syncProgress.stage}</span>
                  <span className="text-sm text-gray-500">{syncProgress.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      syncProgress.stage === 'Failed' ? 'bg-red-500' :
                      syncProgress.stage === 'Complete' ? 'bg-green-500' : 'bg-sf-blue'
                    }`}
                    style={{ width: `${syncProgress.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">{syncProgress.message}</p>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900">Automated Sync</h3>
              <p className="text-sm text-blue-700 mt-1">
                To set up nightly automatic syncs, add this to your cron or Task Scheduler:
              </p>
              <code className="block mt-2 p-2 bg-blue-100 rounded text-xs font-mono text-blue-800">
                cd /path/to/aa-sf-metadata-intelligence/packages/indexer && npx tsx src/cli/sync.ts full -o {selectedOrg || 'aa-sandbox'}
              </code>
            </div>
          </div>

          {/* Sync History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sync History</h2>
              <button
                onClick={loadData}
                className="text-sm text-gray-600 hover:text-sf-blue"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : syncHistory.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {syncHistory.map((record, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        record.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {record.success ? '✓' : '✗'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(record.timestamp).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.metadataRetrieved} files • {record.nodesUpdated} nodes • {record.edgesUpdated} edges
                        </div>
                        {record.errors.length > 0 && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {record.errors[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      record.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {record.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No sync history yet. Run a sync to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orgs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Connected Salesforce Orgs</h2>
              <button
                onClick={loadData}
                className="text-sm text-gray-600 hover:text-sf-blue"
              >
                Refresh Status
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : orgs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {orgs.map((org) => (
                  <div key={org.alias} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{org.alias}</span>
                        {org.orgType && (
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            org.isSandbox
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {org.orgType}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{org.username}</div>
                      <div className="text-xs text-gray-400 mt-1">{org.instanceUrl}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        org.connectedStatus === 'Connected'
                          ? 'bg-green-100 text-green-700'
                          : org.connectedStatus === 'Expired'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {org.connectedStatus}
                      </span>
                      {org.connectedStatus === 'Expired' && (
                        <button
                          onClick={() => {
                            const instanceUrl = org.isSandbox
                              ? 'https://test.salesforce.com'
                              : 'https://login.salesforce.com';
                            navigator.clipboard.writeText(
                              `sf org login web --alias ${org.alias} --instance-url ${instanceUrl}`
                            );
                            alert(`Command copied to clipboard:\n\nsf org login web --alias ${org.alias} --instance-url ${instanceUrl}\n\nRun this in your terminal to reconnect.`);
                          }}
                          className="text-sm text-sf-blue hover:underline"
                        >
                          Reconnect
                        </button>
                      )}
                      <button
                        onClick={() => removeOrg(org.alias)}
                        disabled={removingOrg === org.alias}
                        className="text-sm text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
                      >
                        {removingOrg === org.alias ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No orgs connected.</p>
                <p className="text-sm mt-2">
                  Connect a Salesforce org to start syncing metadata.
                </p>
              </div>
            )}
          </div>

          {/* Connect New Org */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Connect New Org</h2>
            <p className="text-gray-600 mb-4">
              Use the Salesforce CLI to authenticate and connect an org. Choose your org type below
              to get the correct command.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <ConnectOrgCard
                title="Production / Developer Org"
                description="Full org with live data. Use for utilization metrics and record counts."
                icon="🏢"
                isSandbox={false}
              />
              <ConnectOrgCard
                title="Sandbox"
                description="Copy of production for testing. Use for metadata sync and development."
                icon="🧪"
                isSandbox={true}
              />
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">After Running the Command</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
                <li>A browser window will open for Salesforce login</li>
                <li>Log in with your Salesforce credentials</li>
                <li>Allow the CLI access when prompted</li>
                <li>Return here and click "Refresh Status" to see your connected org</li>
              </ol>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-900">Recommended Setup</h3>
            <ul className="mt-2 text-sm text-amber-700 space-y-1">
              <li>• <strong>Sandbox</strong> - For metadata sync (flows, apex, objects)</li>
              <li>• <strong>Production</strong> - For utilization data (record counts, field population)</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Security Overview</h2>
            <p className="text-gray-600 mb-4">
              This application accesses Salesforce metadata and analytics data. Below is the current security posture
              and available configuration options.
            </p>

            {/* Current Authentication Method */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-900">Current Authentication: Salesforce CLI</h3>
              <p className="text-sm text-blue-700 mt-1">
                The application currently uses the Salesforce CLI (sf/sfdx) for authentication.
                This method stores credentials securely in the operating system's keychain/credential store.
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Credentials are managed by Salesforce CLI</li>
                <li>• Access tokens are stored locally in the system keychain</li>
                <li>• No secrets are stored in the application code or database</li>
              </ul>
            </div>

            {/* Security Checklist */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Security Checklist</h3>
              <div className="space-y-2">
                <SecurityCheckItem
                  label="No hardcoded credentials"
                  status="pass"
                  description="All credentials managed via SF CLI or environment variables"
                />
                <SecurityCheckItem
                  label="Local-only database"
                  status="pass"
                  description="SQLite database stored locally, not exposed to network"
                />
                <SecurityCheckItem
                  label="No external data transmission"
                  status="pass"
                  description="Metadata stays on local machine, no third-party analytics"
                />
                <SecurityCheckItem
                  label="HTTPS for Salesforce API"
                  status="pass"
                  description="All Salesforce API calls use TLS encryption"
                />
                <SecurityCheckItem
                  label="Web deployment security"
                  status="warning"
                  description="Additional configuration needed for web deployment (see OAuth section)"
                />
              </div>
            </div>
          </div>

          {/* OAuth Configuration for Web Deployment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">OAuth Configuration (Web Deployment)</h2>
            <p className="text-gray-600 mb-4">
              For deploying this application as a web service, you need to set up a Salesforce Connected App
              and configure OAuth 2.0 authentication.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-amber-900">Status: Not Configured</h3>
              <p className="text-sm text-amber-700 mt-1">
                OAuth is not yet configured. The application currently uses Salesforce CLI for local authentication.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Setup Instructions</h3>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Step 1: Create Connected App in Salesforce</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-4">
                  <li>Go to Setup → App Manager → New Connected App</li>
                  <li>Enable OAuth Settings</li>
                  <li>Set Callback URL to: <code className="bg-gray-100 px-1 rounded">https://your-domain.com/api/auth/callback</code></li>
                  <li>Select OAuth Scopes: <code className="bg-gray-100 px-1 rounded">api</code>, <code className="bg-gray-100 px-1 rounded">refresh_token</code></li>
                  <li>Save and note the Consumer Key and Consumer Secret</li>
                </ol>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Step 2: Configure Environment Variables</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Add these to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:
                </p>
                <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`# Salesforce OAuth Configuration
SF_CLIENT_ID=your_consumer_key_here
SF_CLIENT_SECRET=your_consumer_secret_here
SF_CALLBACK_URL=https://your-domain.com/api/auth/callback
SF_LOGIN_URL=https://login.salesforce.com  # or https://test.salesforce.com for sandbox

# Session secret for encrypting cookies
SESSION_SECRET=generate_a_random_32_char_string`}
                </pre>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Step 3: Security Recommendations</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Never commit <code className="bg-gray-100 px-1 rounded">.env.local</code> to version control</li>
                  <li>• Use separate Connected Apps for sandbox and production</li>
                  <li>• Enable "Require Secret for Web Server Flow" in Connected App settings</li>
                  <li>• Set IP restrictions on the Connected App if possible</li>
                  <li>• Rotate Client Secret periodically</li>
                  <li>• Use HTTPS in production (required for OAuth callbacks)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Web Deployment Security Evaluation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Web Deployment Considerations</h2>

            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-green-800">What's Already Secure</h3>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• No SQL injection vulnerabilities (parameterized queries via sql.js)</li>
                  <li>• No direct database exposure (API routes act as intermediary)</li>
                  <li>• Static metadata analysis (no code execution from Salesforce)</li>
                  <li>• Read-only operations (no modifications to Salesforce data)</li>
                </ul>
              </div>

              <div className="border-l-4 border-amber-500 pl-4">
                <h3 className="font-medium text-amber-800">Needs Configuration for Web</h3>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• OAuth 2.0 implementation for user authentication</li>
                  <li>• Session management with secure cookies</li>
                  <li>• Rate limiting on API endpoints</li>
                  <li>• CORS configuration for allowed origins</li>
                  <li>• CSP (Content Security Policy) headers</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-medium text-red-800">Not Recommended</h3>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• Public deployment without authentication</li>
                  <li>• Storing Salesforce credentials in browser localStorage</li>
                  <li>• Sharing database files containing org metadata</li>
                  <li>• Deploying with DEBUG or development settings enabled</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Recommended Deployment Architecture</h3>
              <p className="text-sm text-gray-600">
                For production web deployment, consider:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Deploy on Vercel, AWS, or Azure with HTTPS</li>
                <li>• Use environment variables for all secrets</li>
                <li>• Implement OAuth 2.0 Web Server Flow</li>
                <li>• Store sessions in Redis or database (not memory)</li>
                <li>• Set up monitoring and logging</li>
                <li>• Regular security updates for dependencies</li>
              </ul>
            </div>
          </div>

          {/* Data Privacy */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Data Privacy</h2>
            <p className="text-gray-600 mb-4">
              This application processes Salesforce metadata. Understanding what data is accessed helps
              maintain compliance with your organization's security policies.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800">Metadata Accessed</h3>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Object definitions and field schemas</li>
                  <li>• Flow/Process Builder definitions</li>
                  <li>• Apex class and trigger source code</li>
                  <li>• Validation rules and formulas</li>
                  <li>• Layout and page configurations</li>
                  <li>• Aggregate record counts (no actual records)</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800">Not Accessed</h3>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Individual record data</li>
                  <li>• User credentials or passwords</li>
                  <li>• Personal identifiable information (PII)</li>
                  <li>• Salesforce user account details</li>
                  <li>• Files or attachments</li>
                  <li>• Chatter posts or messages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">SF Metadata Intelligence</h2>
            <p className="text-gray-600">
              A tool for analyzing, visualizing, and planning changes to your Salesforce metadata.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-sf-blue">v1.0.0</div>
                <div className="text-sm text-gray-500">Version</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-sf-blue">60.0</div>
                <div className="text-sm text-gray-500">Salesforce API Version</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Object and field dependency analysis</li>
                <li>• Impact assessment for metadata changes</li>
                <li>• Retirement checklists</li>
                <li>• Object consolidation planning</li>
                <li>• Field utilization tracking</li>
                <li>• Change tracking over time</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SyncCard({
  title,
  description,
  icon,
  onClick,
  disabled,
  loading,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-4 border border-gray-200 rounded-lg hover:border-sf-blue hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="text-2xl mb-2">{loading ? '⏳' : icon}</div>
      <div className="font-medium text-gray-900">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{description}</div>
    </button>
  );
}

function SecurityCheckItem({
  label,
  status,
  description,
}: {
  label: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}) {
  const statusConfig = {
    pass: { icon: '✓', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    warning: { icon: '!', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    fail: { icon: '✗', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.border} ${config.bg}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${config.text} bg-white`}>
        {config.icon}
      </span>
      <div>
        <div className={`font-medium ${config.text}`}>{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  );
}

function ConnectOrgCard({
  title,
  description,
  icon,
  isSandbox,
}: {
  title: string;
  description: string;
  icon: string;
  isSandbox: boolean;
}) {
  const [alias, setAlias] = useState('');
  const [copied, setCopied] = useState(false);

  const instanceUrl = isSandbox
    ? 'https://test.salesforce.com'
    : 'https://login.salesforce.com';

  const command = alias.trim()
    ? `sf org login web --alias ${alias.trim()} --instance-url ${instanceUrl}`
    : `sf org login web --instance-url ${instanceUrl}`;

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${isSandbox ? 'border-amber-200' : 'border-blue-200'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>

          <div className="mt-3">
            <label className="block text-sm text-gray-600 mb-1">
              Alias (optional)
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={isSandbox ? 'my-sandbox' : 'my-prod'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sf-blue"
            />
          </div>

          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">CLI Command:</div>
            <code className="block p-2 bg-gray-100 rounded text-xs font-mono break-all">
              {command}
            </code>
          </div>

          <button
            onClick={copyCommand}
            className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              copied
                ? 'bg-green-500 text-white'
                : isSandbox
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-sf-blue text-white hover:bg-sf-navy'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Command'}
          </button>
        </div>
      </div>
    </div>
  );
}
