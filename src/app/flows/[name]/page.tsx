import Link from 'next/link';
import path from 'path';
import fs from 'fs';
import { notFound } from 'next/navigation';
import { getNodeByName, getIncomingEdges, getOutgoingEdges } from '@/lib/db';
import FlowVisualizer from '@/components/FlowVisualizer';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ name: string }>;
}

export default async function FlowDetailPage({ params }: Props) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Get flow from database
  const flow = await getNodeByName(decodedName, 'Flow');

  // Find the flow file
  const projectRoot = path.resolve(process.cwd(), '..', '..');
  const flowsDir = path.join(projectRoot, 'force-app', 'main', 'default', 'flows');

  let flowXml = '';
  let flowExists = false;

  const flowPath = path.join(flowsDir, `${decodedName}.flow-meta.xml`);
  if (fs.existsSync(flowPath)) {
    flowXml = fs.readFileSync(flowPath, 'utf-8');
    flowExists = true;
  }

  if (!flow && !flowExists) {
    notFound();
  }

  // Parse flow metadata for header info
  let flowLabel = decodedName;
  let processType = 'Unknown';
  let status = 'Unknown';
  let triggerObject = '';
  let description = '';

  if (flowXml) {
    const labelMatch = flowXml.match(/<label>([^<]+)<\/label>/);
    const processTypeMatch = flowXml.match(/<processType>([^<]+)<\/processType>/);
    const statusMatch = flowXml.match(/<status>([^<]+)<\/status>/);
    const objectMatch = flowXml.match(/<start>[\s\S]*?<object>([^<]+)<\/object>/);
    const descMatch = flowXml.match(/<description>([^<]+)<\/description>/);

    if (labelMatch) flowLabel = labelMatch[1];
    if (processTypeMatch) processType = processTypeMatch[1];
    if (statusMatch) status = statusMatch[1];
    if (objectMatch) triggerObject = objectMatch[1];
    if (descMatch) description = descMatch[1];
  }

  // Get dependencies
  const incomingEdges = flow ? await getIncomingEdges(flow.id) : [];
  const outgoingEdges = flow ? await getOutgoingEdges(flow.id) : [];
  const metadata = flow?.metadata_json ? JSON.parse(flow.metadata_json) : {};
  const touchpoints = metadata.touchpoints || {};

  const processTypeLabels: Record<string, string> = {
    AutoLaunchedFlow: 'Autolaunched Flow',
    Flow: 'Screen Flow',
    RecordTriggeredFlow: 'Record-Triggered Flow',
    Workflow: 'Workflow',
    CustomEvent: 'Platform Event',
    InvocableProcess: 'Invocable Process',
    ScheduledJourney: 'Scheduled Flow',
  };

  const statusColors: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Draft: 'bg-yellow-100 text-yellow-700',
    Obsolete: 'bg-gray-100 text-gray-700',
    InvalidDraft: 'bg-red-100 text-red-700',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/flows" className="hover:text-sf-blue">Flows</Link>
              <span>/</span>
              <span>{decodedName}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{flowLabel}</h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-2 py-0.5 text-xs rounded ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status}
              </span>
              <span className="text-sm text-gray-500">
                {processTypeLabels[processType] || processType}
              </span>
              {triggerObject && (
                <span className="text-sm text-gray-500">
                  Object: <Link href={`/objects/${triggerObject}`} className="text-sf-blue hover:underline">{triggerObject}</Link>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {flow && (
              <Link
                href={`/graph?node=${flow.id}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                View in Graph
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Diagram | Details */}
      <FlowTabs
        flowXml={flowXml}
        flowExists={flowExists}
        decodedName={decodedName}
        touchpoints={touchpoints}
        incomingEdges={incomingEdges}
        outgoingEdges={outgoingEdges}
      />
    </div>
  );
}

// Client component for tabs
import FlowTabsClient from './FlowTabs';

function FlowTabs(props: {
  flowXml: string;
  flowExists: boolean;
  decodedName: string;
  touchpoints: any;
  incomingEdges: any[];
  outgoingEdges: any[];
}) {
  return <FlowTabsClient {...props} />;
}
