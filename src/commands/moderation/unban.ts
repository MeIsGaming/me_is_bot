import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Unban a user by ID')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addStringOption(opt => opt.setName('user_id').setDescription('User ID to unban').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Reason for unban').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const userId = interaction.options.getString('user_id', true).trim();
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  if (!/^\d{17,20}$/.test(userId)) {
    await interaction.reply({ content: 'Invalid user ID.', flags: MessageFlags.Ephemeral });
    return;
  }

  const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
  if (!ban) {
    await interaction.reply({ content: 'That user is not banned.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.guild.bans.remove(userId, `${reason} | by ${interaction.user.tag}`);

  const embed = new EmbedBuilder()
    .setTitle('User unbanned')
    .addFields(
      { name: 'User', value: `${ban.user.username} (<@${ban.user.id}>)`, inline: true },
      { name: 'Moderator', value: interaction.user.username, inline: true },
      { name: 'Reason', value: reason },
    )
    .setColor(0x57F287)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
