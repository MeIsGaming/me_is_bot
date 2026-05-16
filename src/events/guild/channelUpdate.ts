import { Events, DMChannel, NonThreadGuildBasedChannel, EmbedBuilder, AuditLogEvent, ChannelType } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog } from '../../utils/auditlog';
import { getOrCreateGuild } from '../../database';

const CHANNEL_TYPE_NAMES: Partial<Record<ChannelType, string>> = {
  [ChannelType.GuildText]: 'Text channel',
  [ChannelType.GuildVoice]: 'Voice channel',
  [ChannelType.GuildCategory]: 'Category',
  [ChannelType.GuildAnnouncement]: 'Announcement channel',
  [ChannelType.GuildStageVoice]: 'Stage channel',
  [ChannelType.GuildForum]: 'Forum channel',
};

export const name = Events.ChannelUpdate;
export const once = false;

export async function execute(client: BotClient, oldChannel: DMChannel | NonThreadGuildBasedChannel, newChannel: DMChannel | NonThreadGuildBasedChannel): Promise<void> {
  if (!('guild' in newChannel)) return;
  const { guild } = newChannel;
  const settings = getOrCreateGuild(guild.id, guild.ownerId);
  if (settings.ignoredChannels.includes(newChannel.id)) return;

  // Detect what kind of change happened to pick the right audit log action
  let auditAction = AuditLogEvent.ChannelUpdate;
  if ('permissionOverwrites' in oldChannel && 'permissionOverwrites' in newChannel) {
    const oldSize = oldChannel.permissionOverwrites.cache.size;
    const newSize = newChannel.permissionOverwrites.cache.size;
    if (newSize > oldSize) auditAction = AuditLogEvent.ChannelOverwriteCreate;
    else if (newSize < oldSize) auditAction = AuditLogEvent.ChannelOverwriteDelete;
    else if (oldSize === newSize && oldChannel.name === newChannel.name) auditAction = AuditLogEvent.ChannelOverwriteUpdate;
  }

  const log = await fetchAuditLog(guild, auditAction, newChannel.id, { maxAgeMs: 5000, delayMs: 1000 });
  const executor = log?.executor;

  if (executor?.bot && !settings.logBots) return;

  const typeName = CHANNEL_TYPE_NAMES[newChannel.type] ?? 'Channel';
  const embed = new EmbedBuilder()
    .setAuthor({ name: executor?.username ?? 'Unknown', iconURL: executor?.displayAvatarURL() ?? undefined })
    .setDescription(`${typeName} <#${newChannel.id}> (${newChannel.name}) was updated`)
    .setColor(0x03D3FC)
    .setTimestamp();

  const fields: { name: string; value: string }[] = [];

  // Simple property diffs
  if ('topic' in oldChannel && 'topic' in newChannel && oldChannel.topic !== newChannel.topic) {
    fields.push({ name: 'Topic', value: `Now: \`${newChannel.topic || '<none>'}\`\nWas: \`${oldChannel.topic || '<none>'}\`` });
  }
  if ('name' in oldChannel && oldChannel.name !== newChannel.name) {
    fields.push({ name: 'Name', value: `Now: **${newChannel.name}**\nWas: **${oldChannel.name}**` });
  }
  if ('nsfw' in oldChannel && 'nsfw' in newChannel && oldChannel.nsfw !== newChannel.nsfw) {
    fields.push({ name: 'NSFW', value: `Now: ${newChannel.nsfw ? 'enabled' : 'disabled'}` });
  }
  if ('rateLimitPerUser' in oldChannel && 'rateLimitPerUser' in newChannel && oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
    fields.push({ name: 'Slowmode', value: `Now: ${newChannel.rateLimitPerUser}s\nWas: ${oldChannel.rateLimitPerUser}s` });
  }
  if ('bitrate' in oldChannel && 'bitrate' in newChannel && oldChannel.bitrate !== newChannel.bitrate) {
    fields.push({ name: 'Bitrate', value: `Now: ${(newChannel.bitrate / 1000).toFixed(0)}kbps\nWas: ${(oldChannel.bitrate / 1000).toFixed(0)}kbps` });
  }

  // Permission overwrite changes
  if (auditAction !== AuditLogEvent.ChannelUpdate && log?.changes) {
    for (const change of log.changes) {
      if (change.key === '$add' || change.key === '$remove') continue;
      if (change.key === 'id' && log.extra && 'type' in log.extra) {
        const extra = log.extra as { type: string; id: string };
        const targetName = extra.type === '0'
          ? guild.roles.cache.get(extra.id)?.name ?? extra.id
          : `<@${extra.id}>`;
        const actionName = auditAction === AuditLogEvent.ChannelOverwriteCreate ? 'Created' : auditAction === AuditLogEvent.ChannelOverwriteDelete ? 'Deleted' : 'Updated';
        fields.push({ name: `Permission overwrite ${actionName}`, value: `For: ${extra.type === '0' ? `role **${targetName}**` : targetName}` });
      }
    }
  }

  if (fields.length === 0) return;

  embed.addFields(...fields);
  embed.addFields({ name: 'IDs', value: `\`\`\`ini\nUser = ${executor?.id ?? 'Unknown'}\nChannel = ${newChannel.id}\`\`\`` });

  await sendLog(client, guild.id, 'channelUpdate', { embeds: [embed] });
}
