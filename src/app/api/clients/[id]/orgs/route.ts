import { NextRequest, NextResponse } from 'next/server';
import { getDbWithRepositories } from '@/lib/db/index';
import { logger, generateCorrelationId, withCorrelationIdAsync } from '@/lib/logger';
import type { OrgEnvironment, AuthType } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients/[id]/orgs
 * List all org connections for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const clientId = parseInt(params.id, 10);
      if (isNaN(clientId)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
      }

      const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        // Verify client exists
        const client = await connection.repos.clients.findById(clientId);
        if (!client) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const orgs = await connection.repos.orgs.findByClientId(clientId, includeInactive);

        return NextResponse.json({
          orgs,
          client: { id: client.id, name: client.name, slug: client.slug },
        });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to list orgs', { error: error.message, clientId: params.id });
      return NextResponse.json({ error: 'Failed to list org connections' }, { status: 500 });
    }
  });
}

/**
 * POST /api/clients/[id]/orgs
 * Create a new org connection for a client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const clientId = parseInt(params.id, 10);
      if (isNaN(clientId)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
      }

      const body = await request.json();

      // Validate required fields
      if (!body.alias || typeof body.alias !== 'string') {
        return NextResponse.json({ error: 'Alias is required' }, { status: 400 });
      }

      if (!body.environment || !['production', 'sandbox', 'scratch', 'developer'].includes(body.environment)) {
        return NextResponse.json(
          { error: 'Environment must be one of: production, sandbox, scratch, developer' },
          { status: 400 }
        );
      }

      if (!body.auth_type || !['oauth', 'jwt', 'cli'].includes(body.auth_type)) {
        return NextResponse.json(
          { error: 'Auth type must be one of: oauth, jwt, cli' },
          { status: 400 }
        );
      }

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        // Verify client exists
        const client = await connection.repos.clients.findById(clientId);
        if (!client) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const org = await connection.repos.orgs.create({
          client_id: clientId,
          alias: body.alias,
          org_id: body.org_id,
          instance_url: body.instance_url,
          environment: body.environment as OrgEnvironment,
          auth_type: body.auth_type as AuthType,
          created_by: body.created_by,
          metadata: body.metadata,
        });

        // If this is the first org, make it the default
        const allOrgs = await connection.repos.orgs.findByClientId(clientId);
        if (allOrgs.length === 1) {
          await connection.repos.orgs.setDefault(clientId, org.id);
          org.is_default = true;
        }

        // Log audit event
        await connection.repos.audit.create({
          client_id: clientId,
          org_connection_id: org.id,
          event_type: 'org.created',
          event_category: 'org',
          actor: body.created_by,
          resource_type: 'org_connection',
          resource_id: String(org.id),
          details: { alias: org.alias, environment: org.environment },
        });

        logger.info('Org connection created', {
          orgId: org.id,
          clientId,
          alias: org.alias,
        });

        return NextResponse.json({ org }, { status: 201 });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to create org connection', {
        error: error.message,
        clientId: params.id,
      });

      if (error.message?.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { error: 'An org connection with this alias already exists for this client' },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: 'Failed to create org connection' }, { status: 500 });
    }
  });
}
