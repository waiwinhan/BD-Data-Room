import type { H3Event } from 'h3'

/**
 * Non-blocking helper — logs a user action to deal_activity_log.
 * Silently swallows errors so it never breaks the main request.
 */
export async function logActivity(
  event: H3Event,
  dealId: string,
  action: string,
  targetType: string,
  targetName: string,
) {
  try {
    const session    = await getUserSession(event)
    const userLabel  = (session as any)?.user?.label ?? '—'
    const sb         = useSupabase()
    await sb.from('deal_activity_log').insert({
      deal_id: dealId,
      user_label: userLabel,
      action,
      target_type: targetType,
      target_name: targetName,
    })
  } catch { /* non-blocking */ }
}
