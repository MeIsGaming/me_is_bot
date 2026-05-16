import { Events, NonThreadGuildBasedChannel, EmbedBuilder, AuditLogEvent, ChannelType } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog } from '../../utils/auditlog';
import { getOrCreateGuild } from '../../database';
import { dt, snowflakeToMs } from '../../utils/format';

const CHANNEL_TYPE_NAMES: Partial<Record<ChannelType, string>> = {
  [ChannelType.GuildText]: 'Text channel',
  [ChannelType.GuildVoice]: 'Voice channel',
  [ChannelType.GuildCategory]: 'Category',
  [ChannelType.GuildAnnouncement]: 'Announcement channel',
  [ChannelType.GuildStageVoice]: 'Stage channel',
  [ChannelType.GuildForum]: 'Forum channel',
};

export const name = Events.ChannelDelete;
export const once = false;

export async function execute(client: BotClient, channel: NonThreadGuildBasedChannel): Promise<void> {
  const { guild } = channel;
  const settings = getOrCreateGuild(guild.id, guild.ownerId);

  const log = await fetchAuditLog(guild, AuditLogEvent.ChannelDelete, channel.id, { maxAgeMs: 5000, delayMs: 1000 });
  const executor = log?.executor;

  if (executor?.bot && !settings.logBots) return;

  const typeName = CHANNEL_TYPE_NAMES[channel.type] ?? 'Unknown channel type';
  const embed = new EmbedBuilder()
    .setAuthor({ name: executor?.username ?? 'Unknown', iconURL: executor?.displayAvatarURL() ?? undefined })
    .setDescription(`${typeName} deleted: **${channel.name}**`)
    .setColor(0xED4245)
    .setTimestamp()
    .addFields(
      { name: 'Name', value: channel.name },
      { name: 'Created at', value: dt(snowflakeToMs(channel.id)) },
      { name: 'IDs', value: `\`\`\`ini\nUser = ${executor?.id ?? 'Unknown'}\nChannel = ${channel.id}\`\`\`` },
    );

  await sendLog(client, guild.id, 'channelDelete', { embeds: [embed] });
}
