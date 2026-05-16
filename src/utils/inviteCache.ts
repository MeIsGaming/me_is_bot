import { Guild, Invite } from 'discord.js';
import { logger } from './logger';

interface InviteData {
  code: string;
  uses: number;
  maxUses: number;
  channelId: string | null;
}

const cache = new Map<string, Map<string, InviteData>>();

export async function cacheGuildInvites(guild: Guild): Promise<void> {
  const me = guild.members.me;
  if (!me?.permissions.has(['ManageGuild', 'ManageChannels'])) return;

  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return;

  const map = new Map<string, InviteData>();
  for (const invite of invites.values()) {
    map.set(invite.code, {
      code: invite.code,
      uses: invite.uses ?? 0,
      maxUses: invite.maxUses ?? 0,
      channelId: invite.channelId,
    });
  }
  cache.set(guild.id, map);
  logger.debug(`Cached ${map.size} invites for guild ${guild.name}`);
}

export function findUsedInvite(guildId: string, currentInvites: Invite[]): Invite | null {
  const cached = cache.get(guildId);
  if (!cached) return null;
  for (const invite of currentInvites) {
    const old = cached.get(invite.code);
    if (old && (invite.uses ?? 0) > old.uses) return invite;
  }
  return null;
}

export function addInvite(guildId: string, invite: Invite): void {
  const map = cache.get(guildId) ?? new Map();
  map.set(invite.code, {
    code: invite.code,
    uses: invite.uses ?? 0,
    maxUses: invite.maxUses ?? 0,
    channelId: invite.channelId,
  });
  cache.set(guildId, map);
}

export function removeInvite(guildId: string, code: string): void {
  cache.get(guildId)?.delete(code);
}

export function removeGuild(guildId: string): void {
  cache.delete(guildId);
}
