import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags,
} from 'discord.js';
import { addWarning, getWarnings } from '../../database';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Warn a member')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(opt => opt.setName('user').setDescription('Member to warn').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Reason for warn').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  if (target.bot) {
    await interaction.reply({ content: 'You cannot warn bots.', flags: MessageFlags.Ephemeral });
    return;
  }

  const warning = addWarning(interaction.guild.id, target.id, interaction.user.id, reason);
  const total = getWarnings(interaction.guild.id, target.id).length;

  await target.send({
    embeds: [new EmbedBuilder()
      .setTitle(`You received a warning in ${interaction.guild.name}`)
      .addFields({ name: 'Reason', value: reason })
      .setFooter({ text: `Warning #${total}` })
      .setColor(0xFFA500)
      .setTimestamp()],
  }).catch(() => {});

  const embed = new EmbedBuilder()
    .setTitle('Member warned')
    .addFields(
      { name: 'User', value: `${target.username} (<@${target.id}>)`, inline: true },
      { name: 'Moderator', value: interaction.user.username, inline: true },
      { name: 'Warning #', value: `${total}`, inline: true },
      { name: 'Reason', value: reason },
    )
    .setFooter({ text: `Warning ID: ${warning.id}` })
    .setColor(0xFFA500)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
