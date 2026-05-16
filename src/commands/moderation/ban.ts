import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a user from the server')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
  .addIntegerOption(opt => opt
    .setName('delete_days')
    .setDescription('Days of messages to delete (0-7)')
    .setMinValue(0).setMaxValue(7)
    .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'No reason provided';
  const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

  const member = interaction.guild.members.cache.get(target.id)
    ?? await interaction.guild.members.fetch(target.id).catch(() => null);

  if (member) {
    if (!member.bannable) {
      await interaction.reply({ content: 'I cannot ban that member (role hierarchy or permissions).', flags: MessageFlags.Ephemeral });
      return;
    }
    const executorMember = interaction.guild.members.cache.get(interaction.user.id);
    if (executorMember && member.roles.highest.position >= executorMember.roles.highest.position) {
      await interaction.reply({ content: 'You cannot ban someone with an equal or higher role.', flags: MessageFlags.Ephemeral });
      return;
    }
    await member.send({
      embeds: [new EmbedBuilder()
        .setTitle(`You were banned from ${interaction.guild.name}`)
        .addFields({ name: 'Reason', value: reason })
        .setColor(0xFF0000)
        .setTimestamp()],
    }).catch(() => {});
  }

  await interaction.guild.bans.create(target.id, {
    reason: `${reason} | by ${interaction.user.tag}`,
    deleteMessageSeconds: deleteDays * 86400,
  });

  const embed = new EmbedBuilder()
    .setTitle('User banned')
    .addFields(
      { name: 'User', value: `${target.username} (<@${target.id}>)`, inline: true },
      { name: 'Moderator', value: `${interaction.user.username}`, inline: true },
      { name: 'Reason', value: reason },
    )
    .setColor(0xFF0000)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
