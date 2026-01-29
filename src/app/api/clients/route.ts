import { NextRequest, NextResponse } from 'next/server';
import { getDbWithRepositories } from '@/lib/db/index';
import { logger, generateCorrelationId, withCorrelationIdAsync } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients
 * List all client workspaces
 */
export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        const clients = await connection.repos.clients.findAll(includeInactive);
        const count = await connection.repos.clients.count();

        logger.info('Listed clients', { count: clients.length });

        return NextResponse.json({
          clients,
          total: count,
        });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to list clients', { error: error.message });
      return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
    }
  });
}

/**
 * POST /api/clients
 * Create a new client workspace
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();

  return withCorrelationIdAsync(correlationId, async () => {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }

      const connection = await getDbWithRepositories();
      if (!connection) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      try {
        // Check for duplicate slug
        const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = await connection.repos.clients.findBySlug(slug);
        if (existing) {
          return NextResponse.json(
            { error: 'A client with this slug already exists' },
            { status: 409 }
          );
        }

        const client = await connection.repos.clients.create({
          name: body.name,
          slug: body.slug,
          description: body.description,
          created_by: body.created_by,
          settings: body.settings,
        });

        // Log audit event
        await connection.repos.audit.create({
          client_id: client.id,
          event_type: 'client.created',
          event_category: 'client',
          actor: body.created_by,
          resource_type: 'client_workspace',
          resource_id: String(client.id),
          details: { name: client.name, slug: client.slug },
        });

        logger.info('Client created', { clientId: client.id, slug: client.slug });

        return NextResponse.json({ client }, { status: 201 });
      } finally {
        connection.close();
      }
    } catch (error: any) {
      logger.error('Failed to create client', { error: error.message });

      if (error.message?.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { error: 'A client with this slug already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
  });
}
