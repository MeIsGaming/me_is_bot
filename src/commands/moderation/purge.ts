import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags, ChannelType, TextChannel, NewsChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Bulk delete messages (max 100, only messages <14 days old)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption(opt => opt
    .setName('count')
    .setDescription('Number of messages to delete (1-100)')
    .setMinValue(1).setMaxValue(100)
    .setRequired(true))
  .addUserOption(opt => opt
    .setName('user')
    .setDescription('Only delete messages from this user')
    .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const isTextish = interaction.channel?.type === ChannelType.GuildText
    || interaction.channel?.type === ChannelType.GuildAnnouncement;
  if (!isTextish) {
    await interaction.reply({ content: 'This command can only be used in text channels.', flags: MessageFlags.Ephemeral });
    return;
  }

  const channel = interaction.channel as TextChannel | NewsChannel;
  const count = interaction.options.getInteger('count', true);
  const filterUser = interaction.options.getUser('user');

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const fetched = await channel.messages.fetch({ limit: 100 });
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  let eligible = [...fetched.values()].filter(m => m.createdTimestamp > twoWeeksAgo);
  if (filterUser) eligible = eligible.filter(m => m.author.id === filterUser.id);
  eligible = eligible.slice(0, count);

  if (eligible.length === 0) {
    await interaction.editReply('No eligible messages found (messages must be <14 days old).');
    return;
  }

  const deleted = await channel.bulkDelete(eligible, true);

  await interaction.editReply({
    embeds: [new EmbedBuilder()
      .setDescription(`Deleted **${deleted.size}** message(s)${filterUser ? ` from ${filterUser.username}` : ''}.`)
      .setColor(0x5865F2)
      .setTimestamp()],
  });
}
