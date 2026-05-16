import { Events, Role, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog } from '../../utils/auditlog';
import { getOrCreateGuild } from '../../database';
import { intToHex } from '../../utils/format';

export const name = Events.GuildRoleUpdate;
export const once = false;

export async function execute(client: BotClient, oldRole: Role, newRole: Role): Promise<void> {
  const { guild } = newRole;
  const settings = getOrCreateGuild(guild.id, guild.ownerId);

  const log = await fetchAuditLog(guild, AuditLogEvent.RoleUpdate, newRole.id, { maxAgeMs: 5000, delayMs: 1000 });
  const executor = log?.executor;
  if (executor?.bot && !settings.logBots) return;

  const fields: { name: string; value: string }[] = [];

  if (oldRole.name !== newRole.name) fields.push({ name: 'Name', value: `Now: **${newRole.name}**\nWas: **${oldRole.name}**` });
  if (oldRole.color !== newRole.color) fields.push({ name: 'Color', value: `Now: ${intToHex(newRole.color)}\nWas: ${intToHex(oldRole.color)}` });
  if (oldRole.hoist !== newRole.hoist) fields.push({ name: 'Hoisted', value: `Now: ${newRole.hoist ? 'Yes' : 'No'}` });
  if (oldRole.mentionable !== newRole.mentionable) fields.push({ name: 'Mentionable', value: `Now: ${newRole.mentionable ? 'Yes' : 'No'}` });

  // Permission changes
  const oldPerms = oldRole.permissions.toArray();
  const newPerms = newRole.permissions.toArray();
  const added = newPerms.filter(p => !oldPerms.includes(p));
  const removed = oldPerms.filter(p => !newPerms.includes(p));
  if (added.length > 0 || removed.length > 0) {
    const permStr = [
      ...added.map(p => `\`+ ${p}\``),
      ...removed.map(p => `\`− ${p}\``),
    ].join('\n').slice(0, 1000);
    fields.push({ name: 'Permissions changed', value: permStr });
  }

  if (fields.length === 0) return;

  const embed = new EmbedBuilder()
    .setAuthor({ name: executor?.username ?? 'Unknown', iconURL: executor?.displayAvatarURL() ?? undefined })
    .setDescription(`Role **${newRole.name}** was updated`)
    .setColor(newRole.color || 0x5865F2)
    .setTimestamp()
    .addFields(...fields)
    .addFields({ name: 'IDs', value: `\`\`\`ini\nRole = ${newRole.id}\nPerpetrator = ${executor?.id ?? 'Unknown'}\`\`\`` });

  await sendLog(client, guild.id, 'guildRoleUpdate', { embeds: [embed] });
}
