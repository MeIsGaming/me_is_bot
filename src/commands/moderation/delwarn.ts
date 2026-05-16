import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags,
} from 'discord.js';
import { deleteWarning } from '../../database';

export const data = new SlashCommandBuilder()
  .setName('delwarn')
  .setDescription('Delete a specific warning by ID')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addIntegerOption(opt => opt.setName('id').setDescription('Warning ID to delete').setRequired(true).setMinValue(1));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const id = interaction.options.getInteger('id', true);
  const deleted = deleteWarning(id, interaction.guild.id);

  if (!deleted) {
    await interaction.reply({ content: `No warning with ID **${id}** found in this server.`, flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle('Warning deleted')
      .setDescription(`Warning **#${id}** has been deleted.`)
      .setColor(0x57F287)
      .setTimestamp()],
  });
}
