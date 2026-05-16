import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kick a member from the server')
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption(opt => opt.setName('user').setDescription('Member to kick').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  const member = interaction.guild.members.cache.get(target.id)
    ?? await interaction.guild.members.fetch(target.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: 'That user is not in this server.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!member.kickable) {
    await interaction.reply({ content: 'I cannot kick that member (role hierarchy or permissions).', flags: MessageFlags.Ephemeral });
    return;
  }

  const executorMember = interaction.guild.members.cache.get(interaction.user.id);
  if (executorMember && member.roles.highest.position >= executorMember.roles.highest.position) {
    await interaction.reply({ content: 'You cannot kick someone with an equal or higher role.', flags: MessageFlags.Ephemeral });
    return;
  }

  await member.send({
    embeds: [new EmbedBuilder()
      .setTitle(`You were kicked from ${interaction.guild.name}`)
      .addFields({ name: 'Reason', value: reason })
      .setColor(0xFFA500)
      .setTimestamp()],
  }).catch(() => {});

  await member.kick(`${reason} | by ${interaction.user.tag}`);

  const embed = new EmbedBuilder()
    .setTitle('Member kicked')
    .addFields(
      { name: 'User', value: `${target.username} (<@${target.id}>)`, inline: true },
      { name: 'Moderator', value: `${interaction.user.username}`, inline: true },
      { name: 'Reason', value: reason },
    )
    .setColor(0xFFA500)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
