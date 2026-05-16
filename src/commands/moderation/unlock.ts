import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags, ChannelType, TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Unlock a channel (restore @everyone send messages permission)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addStringOption(opt => opt.setName('reason').setDescription('Reason for unlock').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({ content: 'This command can only be used in a text channel.', flags: MessageFlags.Ephemeral });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const reason = interaction.options.getString('reason') ?? 'No reason provided';
  const everyone = interaction.guild.roles.everyone;

  await channel.permissionOverwrites.edit(everyone, {
    SendMessages: null,
  }, { reason: `Unlocked by ${interaction.user.tag}: ${reason}` });

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle('Channel unlocked')
      .setDescription(`${channel} has been unlocked.\n**Reason:** ${reason}`)
      .setColor(0x57F287)
      .setTimestamp()],
  });
}
