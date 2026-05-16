import { Events, VoiceState, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog, executorInfo } from '../../utils/auditlog';
import { getOrCreateGuild } from '../../database';

export const name = Events.VoiceStateUpdate;
export const once = false;

export async function execute(client: BotClient, oldState: VoiceState, newState: VoiceState): Promise<void> {
  const member = newState.member ?? oldState.member;
  if (!member) return;
  const { guild, user } = member;
  if (!user) return;

  const uname = user.username ?? user.id;
  const settings = getOrCreateGuild(guild.id, guild.ownerId);

  const joined = !oldState.channelId && !!newState.channelId;
  const left = !!oldState.channelId && !newState.channelId;
  const switched = !!oldState.channelId && !!newState.channelId && oldState.channelId !== newState.channelId;
  const stateChange = oldState.channelId === newState.channelId && (
    oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf
  );

  if (joined) {
    const channel = newState.channel!;
    if (settings.ignoredChannels.includes(channel.id)) return;
    const embed = new EmbedBuilder()
      .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
      .setDescription(`<@${user.id}> joined voice channel **${channel.name}**`)
      .setColor(0x57F287).setTimestamp()
      .addFields({ name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nChannel = ${channel.id}\`\`\`` });
    await sendLog(client, guild.id, 'voiceChannelJoin', { embeds: [embed] });
    return;
  }

  if (left) {
    const channel = oldState.channel!;
    if (settings.ignoredChannels.includes(channel.id)) return;
    const embed = new EmbedBuilder()
      .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
      .setDescription(`<@${user.id}> left voice channel **${channel.name}**`)
      .setColor(0xED4245).setTimestamp()
      .addFields({ name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nChannel = ${channel.id}\`\`\`` });
    await sendLog(client, guild.id, 'voiceChannelLeave', { embeds: [embed] });
    return;
  }

  if (switched) {
    const from = oldState.channel!;
    const to = newState.channel!;
    if (settings.ignoredChannels.includes(from.id) && settings.ignoredChannels.includes(to.id)) return;
    const embed = new EmbedBuilder()
      .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
      .setDescription(`<@${user.id}> moved voice channels`)
      .setColor(0x5865F2).setTimestamp()
      .addFields(
        { name: 'From', value: `<#${from.id}> (${from.name})`, inline: true },
        { name: 'To', value: `<#${to.id}> (${to.name})`, inline: true },
        { name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nFrom = ${from.id}\nTo = ${to.id}\`\`\`` },
      );
    await sendLog(client, guild.id, 'voiceChannelSwitch', { embeds: [embed] });
    return;
  }

  if (stateChange) {
    const channel = newState.channel;
    if (!channel) return;
    const log = await fetchAuditLog(guild, AuditLogEvent.MemberUpdate, user.id, { maxAgeMs: 3000, delayMs: 1000 });
    if (!log) return;
    const exec = executorInfo(log.executor);

    const actions: string[] = [];
    if (oldState.serverMute !== newState.serverMute) actions.push(newState.serverMute ? 'Server muted' : 'Server unmuted');
    if (oldState.serverDeaf !== newState.serverDeaf) actions.push(newState.serverDeaf ? 'Server deafened' : 'Server undeafened');
    if (actions.length === 0) return;

    const embed = new EmbedBuilder()
      .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
      .setDescription(`<@${user.id}> voice state changed in **${channel.name}**`)
      .setColor(0xFEE75C).setTimestamp()
      .addFields(
        { name: 'Action', value: actions.join(', ') },
        { name: 'Perpetrator', value: exec.name },
        { name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${log.executor?.id ?? 'Unknown'}\nChannel = ${channel.id}\`\`\`` },
      );
    if (log.executor) embed.setFooter({ text: exec.name, iconURL: exec.iconURL });

    await sendLog(client, guild.id, 'voiceStateUpdate', { embeds: [embed] });
  }
}
