import { Events, Role, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog } from '../../utils/auditlog';
import { getOrCreateGuild } from '../../database';
import { intToHex } from '../../utils/format';

export const name = Events.GuildRoleDelete;
export const once = false;

export async function execute(client: BotClient, role: Role): Promise<void> {
  const { guild } = role;
  const settings = getOrCreateGuild(guild.id, guild.ownerId);

  const log = await fetchAuditLog(guild, AuditLogEvent.RoleDelete, role.id, { maxAgeMs: 5000, delayMs: 1000 });
  const executor = log?.executor;
  if (executor?.bot && !settings.logBots) return;

  const embed = new EmbedBuilder()
    .setAuthor({ name: executor?.username ?? 'Unknown', iconURL: executor?.displayAvatarURL() ?? undefined })
    .setDescription(`Role **${role.name}** was deleted`)
    .setColor(role.color || 0xED4245)
    .setTimestamp()
    .addFields(
      { name: 'Name', value: role.name },
      { name: 'Color', value: role.color ? intToHex(role.color) : 'Default', inline: true },
      { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
      { name: 'IDs', value: `\`\`\`ini\nRole = ${role.id}\nPerpetrator = ${executor?.id ?? 'Unknown'}\`\`\`` },
    );

  await sendLog(client, guild.id, 'guildRoleDelete', { embeds: [embed] });
}
