import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Plans are stored as JSON files in the data directory
const getPlansDir = () => {
  const dataDir = path.join(process.cwd(), 'data', 'plans');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
};

export interface PlanItem {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  action: 'create' | 'update' | 'delete' | 'review';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  notes?: string;
  dependentCount?: number;
}

export interface PlanChecklist {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

export interface Plan {
  id: string;
  name: string;
  type: 'implementation' | 'simplification' | 'fix';
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  items: PlanItem[];
  checklist: PlanChecklist[];
  metadata: {
    targetOrg?: string;
    targetDate?: string;
    owner?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  };
}

// GET all plans or a specific plan
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const planId = searchParams.get('id');
  const type = searchParams.get('type');

  try {
    const plansDir = getPlansDir();

    if (planId) {
      // Get specific plan
      const planPath = path.join(plansDir, `${planId}.json`);
      if (!fs.existsSync(planPath)) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
      const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
      return NextResponse.json(plan);
    }

    // Get all plans
    const files = fs.readdirSync(plansDir).filter(f => f.endsWith('.json'));
    const plans: Plan[] = files.map(f => {
      const content = fs.readFileSync(path.join(plansDir, f), 'utf-8');
      return JSON.parse(content);
    });

    // Filter by type if specified
    const filtered = type ? plans.filter(p => p.type === type) : plans;

    // Sort by updated date
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ plans: filtered });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

// POST create a new plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, description, items = [], metadata = {} } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const plansDir = getPlansDir();
    const id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate default checklist based on plan type
    const checklist = generateChecklist(type, items);

    const plan: Plan = {
      id,
      name,
      type,
      description: description || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items,
      checklist,
      metadata,
    };

    fs.writeFileSync(path.join(plansDir, `${id}.json`), JSON.stringify(plan, null, 2));

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

// PUT update a plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const plansDir = getPlansDir();
    const planPath = path.join(plansDir, `${id}.json`);

    if (!fs.existsSync(planPath)) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const existing = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
    const updated: Plan = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(planPath, JSON.stringify(updated, null, 2));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE a plan
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const planId = searchParams.get('id');

  if (!planId) {
    return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
  }

  try {
    const plansDir = getPlansDir();
    const planPath = path.join(plansDir, `${planId}.json`);

    if (!fs.existsSync(planPath)) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    fs.unlinkSync(planPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}

function generateChecklist(type: string, items: PlanItem[]): PlanChecklist[] {
  const checklist: PlanChecklist[] = [];
  let id = 1;

  if (type === 'implementation') {
    // Pre-deployment
    checklist.push(
      { id: `c${id++}`, text: 'Review all metadata components in scope', completed: false, category: 'Pre-Deployment' },
      { id: `c${id++}`, text: 'Identify and document all dependencies', completed: false, category: 'Pre-Deployment' },
      { id: `c${id++}`, text: 'Create backup of target org metadata', completed: false, category: 'Pre-Deployment' },
      { id: `c${id++}`, text: 'Verify sandbox/test environment is ready', completed: false, category: 'Pre-Deployment' },
      { id: `c${id++}`, text: 'Document rollback procedure', completed: false, category: 'Pre-Deployment' },
      { id: `c${id++}`, text: 'Schedule deployment window with stakeholders', completed: false, category: 'Pre-Deployment' },
    );
    // Deployment
    checklist.push(
      { id: `c${id++}`, text: 'Deploy to sandbox/test environment', completed: false, category: 'Deployment' },
      { id: `c${id++}`, text: 'Run all test classes', completed: false, category: 'Deployment' },
      { id: `c${id++}`, text: 'Perform user acceptance testing', completed: false, category: 'Deployment' },
      { id: `c${id++}`, text: 'Deploy to production', completed: false, category: 'Deployment' },
      { id: `c${id++}`, text: 'Verify deployment success', completed: false, category: 'Deployment' },
    );
    // Post-deployment
    checklist.push(
      { id: `c${id++}`, text: 'Update documentation', completed: false, category: 'Post-Deployment' },
      { id: `c${id++}`, text: 'Notify affected users', completed: false, category: 'Post-Deployment' },
      { id: `c${id++}`, text: 'Monitor for issues (24-48 hours)', completed: false, category: 'Post-Deployment' },
      { id: `c${id++}`, text: 'Close deployment ticket/story', completed: false, category: 'Post-Deployment' },
    );
  } else if (type === 'simplification') {
    // Analysis
    checklist.push(
      { id: `c${id++}`, text: 'Run Field Usage Analyzer', completed: false, category: 'Analysis' },
      { id: `c${id++}`, text: 'Review Retirement Assessment candidates', completed: false, category: 'Analysis' },
      { id: `c${id++}`, text: 'Identify all unused/low-usage components', completed: false, category: 'Analysis' },
      { id: `c${id++}`, text: 'Document business justification for each removal', completed: false, category: 'Analysis' },
    );
    // Validation
    checklist.push(
      { id: `c${id++}`, text: 'Verify no active integrations use these components', completed: false, category: 'Validation' },
      { id: `c${id++}`, text: 'Check reports and dashboards for dependencies', completed: false, category: 'Validation' },
      { id: `c${id++}`, text: 'Review with data owners/stakeholders', completed: false, category: 'Validation' },
      { id: `c${id++}`, text: 'Get approval for removal', completed: false, category: 'Validation' },
    );
    // Execution
    checklist.push(
      { id: `c${id++}`, text: 'Export affected data (if needed)', completed: false, category: 'Execution' },
      { id: `c${id++}`, text: 'Remove from page layouts', completed: false, category: 'Execution' },
      { id: `c${id++}`, text: 'Delete unused fields/objects', completed: false, category: 'Execution' },
      { id: `c${id++}`, text: 'Run Health Check to verify stability', completed: false, category: 'Execution' },
    );
    // Documentation
    checklist.push(
      { id: `c${id++}`, text: 'Update data dictionary', completed: false, category: 'Documentation' },
      { id: `c${id++}`, text: 'Document changes in changelog', completed: false, category: 'Documentation' },
      { id: `c${id++}`, text: 'Update training materials if needed', completed: false, category: 'Documentation' },
    );
  } else if (type === 'fix') {
    // Investigation
    checklist.push(
      { id: `c${id++}`, text: 'Reproduce the issue', completed: false, category: 'Investigation' },
      { id: `c${id++}`, text: 'Identify root cause', completed: false, category: 'Investigation' },
      { id: `c${id++}`, text: 'Document affected components', completed: false, category: 'Investigation' },
      { id: `c${id++}`, text: 'Run Impact Analysis on affected areas', completed: false, category: 'Investigation' },
    );
    // Development
    checklist.push(
      { id: `c${id++}`, text: 'Implement fix in sandbox', completed: false, category: 'Development' },
      { id: `c${id++}`, text: 'Write/update test cases', completed: false, category: 'Development' },
      { id: `c${id++}`, text: 'Peer review changes', completed: false, category: 'Development' },
    );
    // Testing
    checklist.push(
      { id: `c${id++}`, text: 'Test fix resolves the issue', completed: false, category: 'Testing' },
      { id: `c${id++}`, text: 'Regression testing', completed: false, category: 'Testing' },
      { id: `c${id++}`, text: 'User acceptance testing', completed: false, category: 'Testing' },
    );
    // Deployment
    checklist.push(
      { id: `c${id++}`, text: 'Deploy to production', completed: false, category: 'Deployment' },
      { id: `c${id++}`, text: 'Verify fix in production', completed: false, category: 'Deployment' },
      { id: `c${id++}`, text: 'Close ticket and notify stakeholders', completed: false, category: 'Deployment' },
    );
  }

  return checklist;
}
