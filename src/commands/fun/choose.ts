import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('choose')
  .setDescription('Pick a random option from a comma-separated list')
  .addStringOption(opt => opt
    .setName('options')
    .setDescription('Comma-separated choices e.g. pizza, burger, sushi')
    .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const raw = interaction.options.getString('options', true);
  const choices = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);

  if (choices.length < 2) {
    await interaction.reply({ content: 'Please provide at least 2 comma-separated options.', flags: MessageFlags.Ephemeral });
    return;
  }

  const picked = choices[Math.floor(Math.random() * choices.length)];

  const embed = new EmbedBuilder()
    .setTitle('I choose...')
    .setDescription(`**${picked}**`)
    .addFields({ name: 'Options', value: choices.map(c => c === picked ? `**${c}**` : c).join(', ') })
    .setColor(0x5865F2)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
