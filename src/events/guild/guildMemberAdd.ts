import { Events, GuildMember, EmbedBuilder } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { cacheGuildInvites, findUsedInvite } from '../../utils/inviteCache';
import { dt } from '../../utils/format';

export const name = Events.GuildMemberAdd;
export const once = false;

export async function execute(client: BotClient, member: GuildMember): Promise<void> {
  const { guild, user } = member;
  const uname = user.username ?? user.id;
  const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / 86_400_000);

  const embed = new EmbedBuilder()
    .setAuthor({ name: uname, iconURL: user.displayAvatarURL() })
    .setDescription(`<@${user.id}> joined`)
    .setColor(0x57F287)
    .setTimestamp()
    .addFields(
      { name: 'Joined at', value: dt(Date.now()), inline: true },
      { name: 'Account age', value: `**${accountAgeDays}** days`, inline: true },
      { name: 'Member count', value: guild.memberCount.toLocaleString(), inline: true },
    );

  const me = guild.members.me;
  if (me?.permissions.has(['ManageGuild', 'ManageChannels'])) {
    try {
      const currentInvites = await guild.invites.fetch();
      const usedInvite = findUsedInvite(guild.id, [...currentInvites.values()]);
      await cacheGuildInvites(guild);

      if (usedInvite) {
        embed.addFields({ name: 'Invite used', value: `\`${usedInvite.code}\` · ${usedInvite.uses?.toLocaleString()} uses`, inline: true });
      } else if (guild.vanityURLCode) {
        embed.addFields({ name: 'Invite used', value: 'Server vanity URL', inline: true });
      } else if (user.bot) {
        embed.addFields({ name: 'Invite used', value: 'OAuth2 (bot added)', inline: true });
      }
    } catch {
      // insufficient permissions or fetch failed
    }
  }

  embed.addFields({ name: 'IDs', value: `\`\`\`ini\nUser = ${user.id}\nGuild = ${guild.id}\`\`\`` });
  await sendLog(client, guild.id, 'guildMemberAdd', { embeds: [embed] });
}
