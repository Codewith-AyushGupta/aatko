import { NextRequest, NextResponse } from 'next/server';
import { getDbWithRepositories } from '@/lib/db/index';
import { logger, generateCorrelationId, withCorrelationIdAsync } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients/[id]
 * Get a single client workspace by ID or slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        let client;

        // Try to find by ID first, then by slug
        const idNum = parseInt(params.id, 10);
        if (!isNaN(idNum)) {
          client = await connection.repos.clients.findById(idNum);
        }

        if (!client) {
          client = await connection.repos.clients.findBySlug(params.id);
        }

        if (!client) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Get org connections for this client
        const orgs = await connection.repos.orgs.findByClientId(client.id);

        // Get recent snapshots
        const snapshots = await connection.repos.snapshots.findByClientId(client.id, 10);

        // Get recent audit events
        const auditEvents = await connection.repos.audit.findByClientId(client.id, 20);

        return NextResponse.json({
          client,
          orgs,
          recentSnapshots: snapshots,
          recentAuditEvents: auditEvents,
        });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to get client', { error: error.message, id: params.id });
      return NextResponse.json({ error: 'Failed to get client' }, { status: 500 });
    }
  });
}

/**
 * PATCH /api/clients/[id]
 * Update a client workspace
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const body = await request.json();
      const id = parseInt(params.id, 10);

      if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
      }

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        const existing = await connection.repos.clients.findById(id);
        if (!existing) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const updated = await connection.repos.clients.update(id, {
          name: body.name,
          description: body.description,
          is_active: body.is_active,
          settings: body.settings,
        });

        // Log audit event
        await connection.repos.audit.create({
          client_id: id,
          event_type: 'client.updated',
          event_category: 'client',
          actor: body.updated_by,
          resource_type: 'client_workspace',
          resource_id: String(id),
          details: { changes: body },
        });

        logger.info('Client updated', { clientId: id });

        return NextResponse.json({ client: updated });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to update client', { error: error.message, id: params.id });
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }
  });
}

/**
 * DELETE /api/clients/[id]
 * Delete a client workspace (soft delete by default)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const id = parseInt(params.id, 10);
      const hardDelete = request.nextUrl.searchParams.get('hard') === 'true';

      if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
      }

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        const existing = await connection.repos.clients.findById(id);
        if (!existing) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        if (hardDelete) {
          await connection.repos.clients.delete(id);
          logger.info('Client hard deleted', { clientId: id });
        } else {
          await connection.repos.clients.update(id, { is_active: false });
          logger.info('Client soft deleted', { clientId: id });
        }

        // Log audit event
        await connection.repos.audit.create({
          client_id: id,
          event_type: hardDelete ? 'client.deleted' : 'client.deactivated',
          event_category: 'client',
          resource_type: 'client_workspace',
          resource_id: String(id),
          details: { name: existing.name, slug: existing.slug },
        });

        return NextResponse.json({ success: true });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to delete client', { error: error.message, id: params.id });
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
  });
}
