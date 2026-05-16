import { Events, Guild, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog, executorInfo } from '../../utils/auditlog';

const VERIFICATION_LEVELS: Record<number, string> = {
  0: 'None', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Very High',
};
const CONTENT_FILTER: Record<number, string> = {
  0: 'Disabled', 1: 'Members without roles', 2: 'All members',
};
const NOTIFICATION_LEVELS: Record<number, string> = {
  0: 'All messages', 1: 'Only @mentions',
};

export const name = Events.GuildUpdate;
export const once = false;

export async function execute(client: BotClient, oldGuild: Guild, newGuild: Guild): Promise<void> {
  const log = await fetchAuditLog(newGuild, AuditLogEvent.GuildUpdate, newGuild.id, { maxAgeMs: 5000, delayMs: 1000 });
  const exec = executorInfo(log?.executor);

  const fields: { name: string; value: string }[] = [];

  if (oldGuild.name !== newGuild.name) fields.push({ name: 'Name', value: `Now: **${newGuild.name}**\nWas: **${oldGuild.name}**` });
  if (oldGuild.icon !== newGuild.icon) {
    const iconUrl = newGuild.iconURL();
    fields.push({ name: 'Icon', value: iconUrl ? `[New icon](${iconUrl})` : 'Removed' });
  }
  if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
    fields.push({ name: 'Verification level', value: `Now: **${VERIFICATION_LEVELS[newGuild.verificationLevel]}**\nWas: **${VERIFICATION_LEVELS[oldGuild.verificationLevel]}**` });
  }
  if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
    fields.push({ name: 'Content filter', value: `Now: **${CONTENT_FILTER[newGuild.explicitContentFilter]}**\nWas: **${CONTENT_FILTER[oldGuild.explicitContentFilter]}**` });
  }
  if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) {
    fields.push({ name: 'Notifications', value: `Now: **${NOTIFICATION_LEVELS[newGuild.defaultMessageNotifications]}**\nWas: **${NOTIFICATION_LEVELS[oldGuild.defaultMessageNotifications]}**` });
  }
  if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
    fields.push({ name: 'AFK channel', value: `Now: ${newGuild.afkChannelId ? `<#${newGuild.afkChannelId}>` : 'None'}\nWas: ${oldGuild.afkChannelId ? `<#${oldGuild.afkChannelId}>` : 'None'}` });
  }
  if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
    fields.push({ name: 'AFK timeout', value: `Now: **${newGuild.afkTimeout / 60}min**\nWas: **${oldGuild.afkTimeout / 60}min**` });
  }
  if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
    fields.push({ name: 'System messages channel', value: `Now: ${newGuild.systemChannelId ? `<#${newGuild.systemChannelId}>` : 'None'}\nWas: ${oldGuild.systemChannelId ? `<#${oldGuild.systemChannelId}>` : 'None'}` });
  }
  if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
    fields.push({ name: 'Rules channel', value: `Now: ${newGuild.rulesChannelId ? `<#${newGuild.rulesChannelId}>` : 'None'}\nWas: ${oldGuild.rulesChannelId ? `<#${oldGuild.rulesChannelId}>` : 'None'}` });
  }
  if (oldGuild.preferredLocale !== newGuild.preferredLocale) {
    fields.push({ name: 'Locale', value: `Now: **${newGuild.preferredLocale}**\nWas: **${oldGuild.preferredLocale}**` });
  }
  if (oldGuild.description !== newGuild.description) {
    fields.push({ name: 'Description', value: `Now: ${newGuild.description || 'None'}\nWas: ${oldGuild.description || 'None'}` });
  }
  if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
    fields.push({ name: 'Vanity URL', value: `Now: **${newGuild.vanityURLCode || 'None'}**\nWas: **${oldGuild.vanityURLCode || 'None'}**` });
  }

  if (fields.length === 0) return;

  const embed = new EmbedBuilder()
    .setAuthor({ name: exec.name, iconURL: exec.iconURL })
    .setDescription('Server settings were updated')
    .setColor(0x5865F2)
    .setTimestamp()
    .addFields(...fields);

  await sendLog(client, newGuild.id, 'guildUpdate', { embeds: [embed] });
}
