import { NextRequest, NextResponse } from 'next/server';
import { getDbWithRepositories } from '@/lib/db/index';
import { logger, generateCorrelationId, withCorrelationIdAsync } from '@/lib/logger';
import type { OrgEnvironment, AuthType } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients/[id]/orgs/[orgId]
 * Get a single org connection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; orgId: string } }
) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const clientId = parseInt(params.id, 10);
      const orgId = parseInt(params.orgId, 10);

      if (isNaN(clientId) || isNaN(orgId)) {
        return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
      }

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        const org = await connection.repos.orgs.findById(orgId);

        if (!org || org.client_id !== clientId) {
          return NextResponse.json({ error: 'Org connection not found' }, { status: 404 });
        }

        // Get recent snapshots for this org
        const snapshots = await connection.repos.snapshots.findByOrgId(orgId, 10);

        return NextResponse.json({
          org,
          recentSnapshots: snapshots,
        });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to get org connection', {
        error: error.message,
        clientId: params.id,
        orgId: params.orgId,
      });
      return NextResponse.json({ error: 'Failed to get org connection' }, { status: 500 });
    }
  });
}

/**
 * PATCH /api/clients/[id]/orgs/[orgId]
 * Update an org connection
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; orgId: string } }
) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const clientId = parseInt(params.id, 10);
      const orgId = parseInt(params.orgId, 10);

      if (isNaN(clientId) || isNaN(orgId)) {
        return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
      }

      const body = await request.json();

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        const existing = await connection.repos.orgs.findById(orgId);

        if (!existing || existing.client_id !== clientId) {
          return NextResponse.json({ error: 'Org connection not found' }, { status: 404 });
        }

        // Validate environment if provided
        if (body.environment && !['production', 'sandbox', 'scratch', 'developer'].includes(body.environment)) {
          return NextResponse.json(
            { error: 'Environment must be one of: production, sandbox, scratch, developer' },
            { status: 400 }
          );
        }

        // Validate auth_type if provided
        if (body.auth_type && !['oauth', 'jwt', 'cli'].includes(body.auth_type)) {
          return NextResponse.json(
            { error: 'Auth type must be one of: oauth, jwt, cli' },
            { status: 400 }
          );
        }

        const updated = await connection.repos.orgs.update(orgId, {
          alias: body.alias,
          org_id: body.org_id,
          instance_url: body.instance_url,
          environment: body.environment as OrgEnvironment | undefined,
          auth_type: body.auth_type as AuthType | undefined,
          is_active: body.is_active,
          is_default: body.is_default,
          connection_status: body.connection_status,
          metadata: body.metadata,
        });

        // If setting as default, update other orgs
        if (body.is_default === true) {
          await connection.repos.orgs.setDefault(clientId, orgId);
        }

        // Log audit event
        await connection.repos.audit.create({
          client_id: clientId,
          org_connection_id: orgId,
          event_type: 'org.updated',
          event_category: 'org',
          actor: body.updated_by,
          resource_type: 'org_connection',
          resource_id: String(orgId),
          details: { changes: body },
        });

        logger.info('Org connection updated', { orgId, clientId });

        return NextResponse.json({ org: updated });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to update org connection', {
        error: error.message,
        clientId: params.id,
        orgId: params.orgId,
      });
      return NextResponse.json({ error: 'Failed to update org connection' }, { status: 500 });
    }
  });
}

/**
 * DELETE /api/clients/[id]/orgs/[orgId]
 * Delete an org connection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; orgId: string } }
) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const clientId = parseInt(params.id, 10);
      const orgId = parseInt(params.orgId, 10);

      if (isNaN(clientId) || isNaN(orgId)) {
        return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
      }

      const hardDelete = request.nextUrl.searchParams.get('hard') === 'true';

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        const existing = await connection.repos.orgs.findById(orgId);

        if (!existing || existing.client_id !== clientId) {
          return NextResponse.json({ error: 'Org connection not found' }, { status: 404 });
        }

        if (hardDelete) {
          await connection.repos.orgs.delete(orgId);
          logger.info('Org connection hard deleted', { orgId, clientId });
        } else {
          await connection.repos.orgs.update(orgId, { is_active: false });
          logger.info('Org connection soft deleted', { orgId, clientId });
        }

        // Log audit event
        await connection.repos.audit.create({
          client_id: clientId,
          org_connection_id: orgId,
          event_type: hardDelete ? 'org.deleted' : 'org.deactivated',
          event_category: 'org',
          resource_type: 'org_connection',
          resource_id: String(orgId),
          details: { alias: existing.alias, environment: existing.environment },
        });

        return NextResponse.json({ success: true });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to delete org connection', {
        error: error.message,
        clientId: params.id,
        orgId: params.orgId,
      });
      return NextResponse.json({ error: 'Failed to delete org connection' }, { status: 500 });
    }
  });
}
