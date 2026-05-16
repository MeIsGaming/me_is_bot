import { Events, GuildBan, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog, executorInfo } from '../../utils/auditlog';

export const name = Events.GuildBanAdd;
export const once = false;

export async function execute(client: BotClient, ban: GuildBan): Promise<void> {
  const { guild, user } = ban;

  const embed = new EmbedBuilder()
    .setAuthor({ name: user.username ?? user.id, iconURL: user.displayAvatarURL() })
    .setDescription(`${user.username ?? user.id} was **banned**`)
    .setColor(0xED4245)
    .setTimestamp()
    .addFields(
      { name: 'User', value: `<@${user.id}> (${user.id})${user.bot ? '\n`BOT`' : ''}` },
      { name: 'Reason', value: 'Fetching...' },
      { name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = Unknown\`\`\`` },
    );

  // Discord is slow to post bans to audit log — wait longer than usual
  const log = await fetchAuditLog(guild, AuditLogEvent.MemberBanAdd, user.id, { maxAgeMs: 60_000, delayMs: 5000 });
  const exec = executorInfo(log?.executor);

  embed.spliceFields(1, 1, { name: 'Reason', value: log?.reason ?? 'None provided' });
  embed.spliceFields(2, 1, { name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${log?.executor?.id ?? 'Unknown'}\`\`\`` });
  if (log?.executor) embed.setFooter({ text: exec.name, iconURL: exec.iconURL });

  await sendLog(client, guild.id, 'guildBanAdd', { embeds: [embed] });
}
