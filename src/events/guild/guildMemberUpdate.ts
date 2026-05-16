import { Events, GuildMember, PartialGuildMember, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog, executorInfo } from '../../utils/auditlog';
import { getOrCreateGuild } from '../../database';
import { dt } from '../../utils/format';

export const name = Events.GuildMemberUpdate;
export const once = false;

export async function execute(client: BotClient, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void> {
  const { guild, user } = newMember;
  if (!user) return;

  const settings = getOrCreateGuild(guild.id, guild.ownerId);
  const uname = user.username ?? user.id;

  // Membership screening passed
  if (!oldMember.partial && oldMember.pending && !newMember.pending) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
      .setDescription(`<@${user.id}> (${uname}) passed membership screening`)
      .setColor(0x1CED9A)
      .setTimestamp();
    await sendLog(client, guild.id, 'guildMemberVerify', { embeds: [embed] });
    return;
  }

  // Boost change
  if (!oldMember.partial && oldMember.premiumSince !== newMember.premiumSince) {
    const isBoosting = !!newMember.premiumSince;
    const embed = new EmbedBuilder()
      .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
      .setDescription(`<@${user.id}> has **${isBoosting ? 'started boosting' : 'stopped boosting'}** the server`)
      .setColor(isBoosting ? 0xFF73FA : 0xEB4034)
      .setTimestamp();
    await sendLog(client, guild.id, 'guildMemberBoostUpdate', { embeds: [embed] });
    return;
  }

  // Nick change
  if (!oldMember.partial && oldMember.nickname !== newMember.nickname) {
    if (user.bot && !settings.logBots) return;
    const embed = new EmbedBuilder()
      .setDescription(`<@${user.id}> nickname changed`)
      .setColor(0x5865F2)
      .setTimestamp()
      .addFields(
        { name: 'New', value: newMember.nickname ?? uname },
        { name: 'Old', value: oldMember.nickname ?? uname },
        { name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\`\`\`` },
      );
    await sendLog(client, guild.id, 'guildMemberNickUpdate', { embeds: [embed] });
    return;
  }

  // Role changes
  if (!oldMember.partial) {
    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());
    const added = [...newRoles].filter(id => !oldRoles.has(id));
    const removed = [...oldRoles].filter(id => !newRoles.has(id));

    if (added.length > 0 || removed.length > 0) {
      if (user.bot && !settings.logBots) return;

      const log = await fetchAuditLog(guild, AuditLogEvent.MemberRoleUpdate, user.id, { maxAgeMs: 3000, delayMs: 800 });
      const exec = executorInfo(log?.executor);

      const changes = [
        ...added.map(id => `➕ **${guild.roles.cache.get(id)?.name ?? id}**`),
        ...removed.map(id => `:x: **${guild.roles.cache.get(id)?.name ?? id}**`),
      ].join('\n').slice(0, 1000);

      const embed = new EmbedBuilder()
        .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
        .setDescription(`<@${user.id}> role(s) updated`)
        .setColor(added.length > 0 ? (guild.roles.cache.get(added[0])?.color || 0x5865F2) : 0xED4245)
        .setTimestamp()
        .addFields(
          { name: 'Changes', value: changes || 'Unknown' },
          { name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${log?.executor?.id ?? 'Unknown'}\`\`\`` },
        );
      if (log?.executor) embed.setFooter({ text: exec.name, iconURL: exec.iconURL });

      await sendLog(client, guild.id, 'guildMemberUpdate', { embeds: [embed] });
      return;
    }
  }

  // Timeout change
  const oldTimeout = oldMember.partial ? null : oldMember.communicationDisabledUntil;
  const newTimeout = newMember.communicationDisabledUntil;
  if (oldTimeout?.getTime() !== newTimeout?.getTime()) {
    if (user.bot && !settings.logBots) return;

    const log = await fetchAuditLog(guild, AuditLogEvent.MemberUpdate, user.id, { maxAgeMs: 3000, delayMs: 800 });
    const exec = executorInfo(log?.executor);
    const isTimed = !!newTimeout;

    const embed = new EmbedBuilder()
      .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
      .setDescription(`<@${user.id}> was ${isTimed ? 'timed out' : 'had timeout removed'}`)
      .setColor(isTimed ? 0xFEE75C : 0x57F287)
      .setTimestamp()
      .addFields({ name: 'Perpetrator', value: exec.name });

    if (isTimed && newTimeout) {
      embed.addFields({ name: 'Expires', value: `${dt(newTimeout.getTime())} (${dt(newTimeout.getTime(), 'R')})` });
    }
    embed.addFields({ name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${log?.executor?.id ?? 'Unknown'}\`\`\`` });
    if (log?.executor) embed.setFooter({ text: exec.name, iconURL: exec.iconURL });

    await sendLog(client, guild.id, 'guildMemberUpdate', { embeds: [embed] });
  }
}
