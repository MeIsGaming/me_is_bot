import { Events, GuildBan, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog, executorInfo } from '../../utils/auditlog';

export const name = Events.GuildBanRemove;
export const once = false;

export async function execute(client: BotClient, ban: GuildBan): Promise<void> {
  const { guild, user } = ban;

  const log = await fetchAuditLog(guild, AuditLogEvent.MemberBanRemove, user.id, { maxAgeMs: 5000, delayMs: 1500 });
  const exec = executorInfo(log?.executor);

  const embed = new EmbedBuilder()
    .setAuthor({ name: user.username ?? user.id, iconURL: user.displayAvatarURL() })
    .setDescription(`${user.username ?? user.id} was **unbanned**`)
    .setColor(0x57F287)
    .setTimestamp()
    .addFields(
      { name: 'User', value: `<@${user.id}> (${user.id})` },
      { name: 'Reason', value: log?.reason ?? 'None provided' },
      { name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${log?.executor?.id ?? 'Unknown'}\`\`\`` },
    );
  if (log?.executor) embed.setFooter({ text: exec.name, iconURL: exec.iconURL });

  await sendLog(client, guild.id, 'guildBanRemove', { embeds: [embed] });
}
