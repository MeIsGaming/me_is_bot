import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags, ChannelType, TextChannel, PermissionsBitField,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Lock a channel (deny @everyone from sending messages)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addStringOption(opt => opt.setName('reason').setDescription('Reason for lock').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({ content: 'This command can only be used in a text channel.', flags: MessageFlags.Ephemeral });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const reason = interaction.options.getString('reason') ?? 'No reason provided';
  const everyone = interaction.guild.roles.everyone;

  await channel.permissionOverwrites.edit(everyone, {
    SendMessages: false,
  }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle('Channel locked')
      .setDescription(`${channel} has been locked.\n**Reason:** ${reason}`)
      .setColor(0xFF0000)
      .setTimestamp()],
  });
}
