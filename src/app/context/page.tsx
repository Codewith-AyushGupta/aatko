import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface ContextFile {
  name: string;
  path: string;
  category: string;
  content?: string;
}

async function getContextFiles(): Promise<Record<string, ContextFile[]>> {
  const contextDir = path.resolve(process.cwd(), '..', '..', 'context');
  const categories: Record<string, ContextFile[]> = {};

  if (!fs.existsSync(contextDir)) {
    return categories;
  }

  const readDir = (dir: string, category: string) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        readDir(filePath, file);
      } else if (file.endsWith('.md')) {
        if (!categories[category]) categories[category] = [];
        categories[category].push({
          name: file.replace('.md', '').replace(/_/g, ' '),
          path: filePath,
          category,
        });
      }
    }
  };

  readDir(contextDir, 'root');

  // Also check runbooks directory
  const runbooksDir = path.resolve(process.cwd(), '..', '..', 'runbooks');
  if (fs.existsSync(runbooksDir)) {
    readDir(runbooksDir, 'runbooks');
  }

  return categories;
}

async function getStakeholders(): Promise<any[]> {
  const stakeholderFile = path.resolve(
    process.cwd(), '..', '..', 'context', 'stakeholders', 'humans_involved_stakeholder_map.md'
  );

  if (!fs.existsSync(stakeholderFile)) {
    return [];
  }

  const content = fs.readFileSync(stakeholderFile, 'utf-8');

  // Parse the table from the markdown
  const tableMatch = content.match(/\| Name \| Role \|[\s\S]*?\n\n/);
  if (!tableMatch) return [];

  const lines = tableMatch[0].split('\n').filter(line => line.startsWith('|') && !line.includes('---'));
  const stakeholders: any[] = [];

  for (let i = 1; i < lines.length; i++) { // Skip header
    const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
    if (cells.length >= 5) {
      stakeholders.push({
        name: cells[0].replace(/\*\*/g, ''),
        role: cells[1],
        email: cells[2],
        phone: cells[3],
        context: cells[4],
      });
    }
  }

  return stakeholders;
}

export default async function ContextPage() {
  const contextFiles = await getContextFiles();
  const stakeholders = await getStakeholders();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Project Context</h1>
        <p className="text-gray-600 mt-1">
          Stakeholder information, decisions, and project context
        </p>
      </div>

      {/* Stakeholders Section */}
      <section className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Stakeholders</h2>
          <p className="text-sm text-gray-500 mt-1">
            Key people involved in the Salesforce program
          </p>
        </div>

        {stakeholders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stakeholders.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.role}</td>
                    <td className="px-6 py-4 text-sm text-sf-blue">
                      {s.email !== '—' && s.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md">{s.context}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No stakeholder data found. Add context files to the <code className="bg-gray-100 px-1 rounded">context/</code> directory.
          </div>
        )}
      </section>

      {/* Context Files */}
      <section className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Context Documents</h2>
          <p className="text-sm text-gray-500 mt-1">
            Project documentation and decisions
          </p>
        </div>

        <div className="p-6">
          {Object.keys(contextFiles).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(contextFiles).map(([category, files]) => (
                <div key={category} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 capitalize mb-3">
                    {category === 'root' ? 'General' : category}
                  </h3>
                  <ul className="space-y-2">
                    {files.map((file, i) => (
                      <li key={i}>
                        <Link
                          href={`/context/${encodeURIComponent(file.category)}/${encodeURIComponent(file.name)}`}
                          className="text-sm text-sf-blue hover:underline flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {file.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>No context documents found.</p>
              <p className="text-sm mt-2">
                Add markdown files to the <code className="bg-gray-100 px-1 rounded">context/</code> directory.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Add Context Instructions */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900">Adding Context</h3>
        <p className="text-sm text-blue-700 mt-2">
          To add more context to your project:
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>1. Add stakeholder information to <code className="bg-blue-100 px-1 rounded">context/stakeholders/</code></li>
          <li>2. Add decision records to <code className="bg-blue-100 px-1 rounded">context/decisions/</code></li>
          <li>3. Add conversation notes to <code className="bg-blue-100 px-1 rounded">context/conversations/</code></li>
          <li>4. Add runbooks to <code className="bg-blue-100 px-1 rounded">runbooks/</code></li>
        </ul>
      </section>
    </div>
  );
}
