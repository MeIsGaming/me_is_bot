import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType, MessageFlags } from 'discord.js';
import { dt } from '../../utils/format';

const VERIFICATION_LEVELS: Record<number, string> = {
  0: 'None', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Very High',
};

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Show information about this server');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  await guild.fetch();

  const channels = guild.channels.cache;
  const textCount = channels.filter(c => c.type === ChannelType.GuildText).size;
  const voiceCount = channels.filter(c => c.type === ChannelType.GuildVoice).size;
  const categoryCount = channels.filter(c => c.type === ChannelType.GuildCategory).size;

  const owner = await guild.fetchOwner().catch(() => null);

  const embed = new EmbedBuilder()
    .setTitle(guild.name)
    .setThumbnail(guild.iconURL())
    .setColor(0x5865F2)
    .setTimestamp()
    .addFields(
      { name: 'ID', value: guild.id, inline: true },
      { name: 'Owner', value: owner ? `${owner.user.username} (<@${owner.id}>)` : `<@${guild.ownerId}>`, inline: true },
      { name: 'Created', value: dt(guild.createdTimestamp) },
      { name: 'Members', value: guild.memberCount.toLocaleString(), inline: true },
      { name: 'Boosts', value: `${guild.premiumSubscriptionCount ?? 0} (Tier ${guild.premiumTier})`, inline: true },
      { name: 'Verification', value: VERIFICATION_LEVELS[guild.verificationLevel], inline: true },
      { name: 'Channels', value: `${channels.size} total · ${textCount} text · ${voiceCount} voice · ${categoryCount} categories`, },
      { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
      { name: 'Emojis', value: guild.emojis.cache.size.toString(), inline: true },
    );

  if (guild.features.length > 0) {
    embed.addFields({ name: 'Features', value: guild.features.join(', ') });
  }

  if (guild.bannerURL()) embed.setImage(guild.bannerURL());

  await interaction.reply({ embeds: [embed] });
}
