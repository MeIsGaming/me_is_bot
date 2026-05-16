import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
} from 'discord.js';

const RESPONSES = [
  // Positive
  'It is certain.', 'It is decidedly so.', 'Without a doubt.',
  'Yes, definitely.', 'You may rely on it.', 'As I see it, yes.',
  'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
  // Neutral
  'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
  'Cannot predict now.', 'Concentrate and ask again.',
  // Negative
  "Don't count on it.", 'My reply is no.', 'My sources say no.',
  'Outlook not so good.', 'Very doubtful.',
];

const COLORS = [0x57F287, 0x57F287, 0x57F287, 0x57F287, 0x57F287,
  0x57F287, 0x57F287, 0x57F287, 0x57F287, 0x57F287,
  0xFEE75C, 0xFEE75C, 0xFEE75C, 0xFEE75C, 0xFEE75C,
  0xED4245, 0xED4245, 0xED4245, 0xED4245, 0xED4245];

export const data = new SlashCommandBuilder()
  .setName('8ball')
  .setDescription('Ask the magic 8-ball a question')
  .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const question = interaction.options.getString('question', true);
  const idx = Math.floor(Math.random() * RESPONSES.length);

  const embed = new EmbedBuilder()
    .setTitle('🎱 Magic 8-Ball')
    .addFields(
      { name: 'Question', value: question },
      { name: 'Answer', value: RESPONSES[idx] },
    )
    .setColor(COLORS[idx])
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
