import { Events, GuildMember, PartialGuildMember, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog, executorInfo } from '../../utils/auditlog';
import { dt } from '../../utils/format';

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(client: BotClient, member: GuildMember | PartialGuildMember): Promise<void> {
  const { guild, user } = member;
  if (!user) return;

  const uname = user.username ?? user.id;

  // Check if this was a kick
  const kickLog = await fetchAuditLog(guild, AuditLogEvent.MemberKick, user.id, { maxAgeMs: 3000, delayMs: 1000 });

  if (kickLog) {
    const exec = executorInfo(kickLog.executor);
    const roles = member.partial ? [] : [...member.roles.cache.values()].filter(r => r.id !== guild.id);
    const joinedAt = member.partial ? null : member.joinedAt;

    const embed = new EmbedBuilder()
      .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
      .setDescription(`${uname} was **kicked**`)
      .setColor(0xED4245)
      .setTimestamp()
      .addFields(
        { name: 'User', value: `<@${user.id}> (${user.id})` },
        { name: 'Reason', value: kickLog.reason ?? 'None provided' },
      );

    if (roles.length > 0) embed.addFields({ name: 'Roles', value: roles.map(r => r.name).join(', ') });
    if (joinedAt) embed.addFields({ name: 'Joined at', value: dt(joinedAt.getTime()) });
    embed.addFields({ name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${kickLog.executor?.id ?? 'Unknown'}\`\`\`` });
    if (kickLog.executor) embed.setFooter({ text: exec.name, iconURL: exec.iconURL });

    await sendLog(client, guild.id, 'guildMemberKick', { embeds: [embed] });
    return;
  }

  // Regular leave
  const roles = member.partial ? [] : [...member.roles.cache.values()].filter(r => r.id !== guild.id);
  const joinedAt = member.partial ? null : member.joinedAt;

  const embed = new EmbedBuilder()
    .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
    .setDescription(`${uname} left the server`)
    .setColor(0xED4245)
    .setTimestamp()
    .addFields({ name: 'User', value: `<@${user.id}> (${user.id})` });

  if (roles.length > 0) embed.addFields({ name: 'Roles', value: roles.map(r => r.name).join(', ') });
  if (joinedAt) embed.addFields(
    { name: 'Joined at', value: dt(joinedAt.getTime()) },
    { name: 'Time in server', value: `${Math.floor((Date.now() - joinedAt.getTime()) / 86_400_000)} days` },
  );
  embed.addFields({ name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\`\`\`` });

  await sendLog(client, guild.id, 'guildMemberRemove', { embeds: [embed] });
}
