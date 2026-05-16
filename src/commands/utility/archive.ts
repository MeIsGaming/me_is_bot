import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  ChannelType, PermissionFlagsBits, TextChannel, NewsChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('archive')
  .setDescription('Archive recent messages in this channel as a text file')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption(opt => opt
    .setName('count')
    .setDescription('Number of messages to archive (5–100, default 50)')
    .setMinValue(5)
    .setMaxValue(100)
    .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const isTextish = interaction.channel?.type === ChannelType.GuildText
    || interaction.channel?.type === ChannelType.GuildAnnouncement;
  if (!interaction.guild || !isTextish) {
    await interaction.reply({ content: 'This command can only be used in a server text or announcement channel.', ephemeral: true });
    return;
  }

  const count = interaction.options.getInteger('count') ?? 50;
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel as TextChannel | NewsChannel;
  const messages = await channel.messages.fetch({ limit: count }).catch(() => null);

  if (!messages || messages.size === 0) {
    await interaction.editReply({ content: 'No messages found.' });
    return;
  }

  const lines = [...messages.values()]
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map(m => {
      const ts = new Date(m.createdTimestamp).toUTCString();
      const author = m.author.username;
      const content = m.content || (m.embeds.length > 0 ? '<embed>' : '<no text>');
      const attachments = m.attachments.size > 0
        ? ` [${[...m.attachments.values()].map(a => a.name).join(', ')}]`
        : '';
      return `[${ts}] ${author}: ${content}${attachments}`;
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setDescription(`Archived **${messages.size}** messages from <#${channel.id}>`)
    .setColor(0x5865F2)
    .setTimestamp();

  await interaction.editReply({
    embeds: [embed],
    files: [{ attachment: Buffer.from(lines, 'utf-8'), name: `archive-${channel.name}-${Date.now()}.txt` }],
  });
}
