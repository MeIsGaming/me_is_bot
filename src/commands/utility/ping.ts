import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Show bot latency');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const { resource } = await interaction.reply({ content: 'Pinging...', withResponse: true });
  const roundtrip = (resource?.message?.createdTimestamp ?? Date.now()) - interaction.createdTimestamp;
  const ws = interaction.client.ws.ping;

  await interaction.editReply({ content: '', embeds: [new EmbedBuilder()
    .setTitle('Pong!')
    .setColor(0x5865F2)
    .setTimestamp()
    .addFields(
      { name: 'Roundtrip', value: `${roundtrip}ms`, inline: true },
      { name: 'WebSocket', value: `${ws}ms`, inline: true },
    ),
  ] });
}
