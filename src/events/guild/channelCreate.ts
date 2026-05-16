import { Events, NonThreadGuildBasedChannel, EmbedBuilder, AuditLogEvent, ChannelType } from 'discord.js';
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

export const name = Events.ChannelCreate;
export const once = false;

export async function execute(client: BotClient, channel: NonThreadGuildBasedChannel): Promise<void> {
  const { guild } = channel;
  const settings = getOrCreateGuild(guild.id, guild.ownerId);

  const log = await fetchAuditLog(guild, AuditLogEvent.ChannelCreate, channel.id, { maxAgeMs: 5000, delayMs: 1000 });
  const executor = log?.executor;

  if (executor?.bot && !settings.logBots) return;

  const typeName = CHANNEL_TYPE_NAMES[channel.type] ?? 'Unknown channel type';
  const embed = new EmbedBuilder()
    .setAuthor({ name: executor?.username ?? 'Unknown', iconURL: executor?.displayAvatarURL() ?? undefined })
    .setDescription(`${typeName} created: <#${channel.id}>`)
    .setColor(0x57F287)
    .setTimestamp()
    .addFields(
      { name: 'Name', value: channel.name },
      { name: 'IDs', value: `\`\`\`ini\nUser = ${executor?.id ?? 'Unknown'}\nChannel = ${channel.id}\`\`\`` },
    );

  if ('permissionOverwrites' in channel) {
    const overwrites = [...channel.permissionOverwrites.cache.values()].filter(o => {
      const role = guild.roles.cache.get(o.id);
      return role && role.name !== '@everyone';
    });
    for (const ow of overwrites.slice(0, 5)) {
      const role = guild.roles.cache.get(ow.id);
      if (role) embed.addFields({ name: `Overwrite: ${role.name}`, value: `Type: role` });
    }
  }

  await sendLog(client, guild.id, 'channelCreate', { embeds: [embed] });
}
