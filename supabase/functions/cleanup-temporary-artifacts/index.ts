// Daily cleanup worker for temporary/operational artifacts.
// Safe by design: only touches ephemeral data. Invoices, client documents,
// successful email history, customer records, compliance data are NEVER deleted.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RETENTION_DAYS = 30

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = parts[1]
      .replaceAll('-', '+').replaceAll('_', '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(atob(payload)) as Record<string, unknown>
  } catch { return null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Defense in depth: only service-role callers (cron) may trigger cleanup.
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const claims = parseJwtClaims(auth.slice(7).trim())
  if (claims?.role !== 'service_role') {
    return new Response(JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const summary: Record<string, unknown> = {}

  // 1) Database cleanup (pgmq archives, whatsapp clicks, expired tokens, failed email rows)
  try {
    const { data, error } = await supabase.rpc('run_temporary_cleanup', { retention_days: RETENTION_DAYS })
    if (error) throw error
    summary.database = data
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    summary.database_error = msg
    await supabase.from('cleanup_audit_log').insert({
      category: 'database_rpc', removed_count: 0, error: msg.slice(0, 1000),
    })
  }

  // 2) Storage: remove ORPHAN invoice PDFs older than 30d
  //    An orphan = a PDF in the `invoices` bucket whose path is not referenced
  //    by any row in public.invoices.pdf_url. Final/issued invoices are protected.
  try {
    const cutoff = Date.now() - RETENTION_DAYS * 86_400_000
    const orphans: string[] = []
    let offset = 0
    const PAGE = 1000

    // Build set of referenced storage paths (anything that lives in the invoices bucket).
    const referenced = new Set<string>()
    const { data: invs, error: invErr } = await supabase
      .from('invoices').select('pdf_url').not('pdf_url', 'is', null)
    if (invErr) throw invErr
    for (const r of invs ?? []) {
      const url = r.pdf_url as string | null
      if (!url) continue
      // pdf_url may be a signed URL or a storage path; extract the path after the bucket name
      const m = url.match(/\/invoices\/([^?]+)/)
      if (m) referenced.add(decodeURIComponent(m[1]))
      else referenced.add(url) // raw path fallback
    }

    // Walk the bucket root (and one level of folders) and collect old orphans.
    async function listAndCollect(prefix: string) {
      let page = 0
      while (true) {
        const { data, error } = await supabase.storage.from('invoices').list(prefix, {
          limit: PAGE, offset: page * PAGE, sortBy: { column: 'name', order: 'asc' },
        })
        if (error) throw error
        if (!data || data.length === 0) break
        for (const item of data) {
          const full = prefix ? `${prefix}/${item.name}` : item.name
          if (item.id === null) {
            // folder — recurse one level (avoid runaway depth)
            if (prefix.split('/').length < 3) await listAndCollect(full)
            continue
          }
          const createdAt = item.created_at ? new Date(item.created_at).getTime() : 0
          if (createdAt && createdAt < cutoff && !referenced.has(full)) {
            orphans.push(full)
          }
        }
        if (data.length < PAGE) break
        page++
      }
    }
    await listAndCollect('')

    let removed = 0
    // Batch delete in chunks of 100
    for (let i = 0; i < orphans.length; i += 100) {
      const batch = orphans.slice(i, i + 100)
      const { error } = await supabase.storage.from('invoices').remove(batch)
      if (!error) removed += batch.length
    }
    summary.invoice_storage_orphans = removed
    await supabase.from('cleanup_audit_log').insert({
      category: 'invoices_storage_orphans',
      removed_count: removed,
      details: { scanned: orphans.length, retention_days: RETENTION_DAYS },
    })
    offset // silence linter
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    summary.invoice_storage_error = msg
    await supabase.from('cleanup_audit_log').insert({
      category: 'invoices_storage_orphans', removed_count: 0, error: msg.slice(0, 1000),
    })
  }

  return new Response(JSON.stringify({ ok: true, summary, retention_days: RETENTION_DAYS }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
