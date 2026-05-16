import { Guild, AuditLogEvent, GuildAuditLogsEntry, User, PartialUser } from 'discord.js';

interface FetchOptions {
  maxAgeMs?: number;
  delayMs?: number;
}

export async function fetchAuditLog(
  guild: Guild,
  action: AuditLogEvent,
  targetId: string,
  { maxAgeMs = 5000, delayMs = 1500 }: FetchOptions = {},
): Promise<GuildAuditLogsEntry | null> {
  if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));

  const logs = await guild.fetchAuditLogs({ type: action, limit: 10 }).catch(() => null);
  if (!logs) return null;

  return logs.entries.find(e => {
    if (Date.now() - e.createdTimestamp > maxAgeMs) return false;
    const t = e.target;
    if (!t || !('id' in t)) return false;
    return (t as { id: string }).id === targetId;
  }) ?? null;
}

/** Safely extracts display name and avatar from an audit log executor (User | null). */
export function executorInfo(user: User | PartialUser | null | undefined): { name: string; iconURL: string | undefined } {
  if (!user) return { name: 'Unknown', iconURL: undefined };
  return {
    name: user.username ?? user.id,
    iconURL: user.displayAvatarURL(),
  };
}
