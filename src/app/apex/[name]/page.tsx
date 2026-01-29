import Link from 'next/link';
import path from 'path';
import fs from 'fs';
import { notFound } from 'next/navigation';
import { getNodeByName, getIncomingEdges, getOutgoingEdges } from '@/lib/db';
import ApexTabs from './ApexTabs';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ name: string }>;
}

export default async function ApexDetailPage({ params }: Props) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Try ApexClass first, then ApexTrigger
  let apex = await getNodeByName(decodedName, 'ApexClass');
  let apexType = 'ApexClass';
  if (!apex) {
    apex = await getNodeByName(decodedName, 'ApexTrigger');
    apexType = 'ApexTrigger';
  }

  // Try to read the actual source file
  const projectRoot = path.resolve(process.cwd(), '..', '..');
  let apexCode = '';
  let fileFound = false;

  // Check for class file
  const classPath = path.join(projectRoot, 'force-app', 'main', 'default', 'classes', `${decodedName}.cls`);
  if (fs.existsSync(classPath)) {
    apexCode = fs.readFileSync(classPath, 'utf-8');
    fileFound = true;
  }

  // Check for trigger file
  if (!fileFound) {
    const triggerPath = path.join(projectRoot, 'force-app', 'main', 'default', 'triggers', `${decodedName}.trigger`);
    if (fs.existsSync(triggerPath)) {
      apexCode = fs.readFileSync(triggerPath, 'utf-8');
      fileFound = true;
    }
  }

  if (!apex && !fileFound) {
    notFound();
  }

  const incomingEdges = apex ? await getIncomingEdges(apex.id) : [];
  const outgoingEdges = apex ? await getOutgoingEdges(apex.id) : [];
  const metadata = apex?.metadata_json ? JSON.parse(apex.metadata_json) : {};

  // Parse some basic info from code if not in metadata
  const isTest = metadata.isTest || /@isTest/i.test(apexCode) || /testMethod/i.test(apexCode);
  const isGlobal = metadata.isGlobal || /\bglobal\s+class\b/i.test(apexCode);
  const triggerObject = metadata.triggerObject || (apexCode.match(/trigger\s+\w+\s+on\s+(\w+)/i)?.[1]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/apex" className="hover:text-sf-blue">Apex</Link>
              <span>/</span>
              <span>{decodedName}</span>
            </div>
            <h1 className="text-2xl font-bold font-mono text-gray-900">{decodedName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 text-xs rounded ${
                apexType === 'ApexTrigger' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {apexType === 'ApexTrigger' ? 'Trigger' : 'Class'}
              </span>
              {isTest && (
                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">Test</span>
              )}
              {isGlobal && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Global</span>
              )}
              {triggerObject && (
                <span className="text-sm text-gray-500">
                  on <Link href={`/objects/${triggerObject}`} className="text-sf-blue hover:underline">{triggerObject}</Link>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {apex && (
              <Link
                href={`/graph?node=${apex.id}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                View in Graph
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ApexTabs
        apexCode={apexCode}
        fileFound={fileFound}
        decodedName={decodedName}
        metadata={metadata}
        incomingEdges={incomingEdges}
        outgoingEdges={outgoingEdges}
      />
    </div>
  );
}
