import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Comprehensive health check endpoint
 * Returns status of all critical services
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {} as Record<string, { status: string; message?: string }>
  };

  // 1. Check Database
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from('perfiles').select('id').limit(1);

    if (error) {
      checks.services.database = { status: 'unhealthy', message: error.message };
      checks.status = 'degraded';
    } else {
      checks.services.database = { status: 'healthy' };
    }
  } catch (error: any) {
    checks.services.database = { status: 'unhealthy', message: error.message };
    checks.status = 'degraded';
  }

  // 2. Check Gemini API
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      checks.services.gemini = { status: 'not_configured', message: 'GEMINI_API_KEY not set' };
    } else {
      checks.services.gemini = { status: 'configured' };
    }
  } catch (error: any) {
    checks.services.gemini = { status: 'error', message: error.message };
  }

  // 3. Check Email Service
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      checks.services.email = { status: 'not_configured', message: 'RESEND_API_KEY not set' };
      checks.status = 'degraded';
    } else {
      checks.services.email = { status: 'configured' };
    }
  } catch (error: any) {
    checks.services.email = { status: 'error', message: error.message };
  }

  // 4. Check Pipedrive
  try {
    const pipedriveKey = process.env.PIPEDRIVE_API_KEY;
    const pipedriveDomain = process.env.PIPEDRIVE_DOMAIN;

    if (!pipedriveKey || !pipedriveDomain) {
      checks.services.pipedrive = { status: 'not_configured', message: 'PIPEDRIVE credentials not set' };
    } else {
      checks.services.pipedrive = { status: 'configured' };
    }
  } catch (error: any) {
    checks.services.pipedrive = { status: 'error', message: error.message };
  }

  // 5. Check Encryption
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      checks.services.encryption = { status: 'warning', message: 'Using fallback encryption key' };
    } else {
      checks.services.encryption = { status: 'healthy' };
    }
  } catch (error: any) {
    checks.services.encryption = { status: 'error', message: error.message };
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}

/**
 * HEAD request for simple connectivity check
 * Used by offline detection system
 */
export async function HEAD() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
