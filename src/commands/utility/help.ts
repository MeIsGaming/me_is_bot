import {
  SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder,
} from 'discord.js';
import { BotClient } from '../../types';

// Discord slash command option type numbers from the API spec
const OPTION_TYPE_NAMES: Record<number, string> = {
  1: 'Subcommand', 2: 'Subcommand Group',
  3: 'String', 4: 'Integer', 5: 'Boolean',
  6: 'User', 7: 'Channel', 8: 'Role',
  9: 'Mentionable', 10: 'Number', 11: 'Attachment',
};

// Hardcoded categories so commands appear in a logical order
const COMMAND_CATEGORIES: [string, string[]][] = [
  ['Logging', ['log']],
  ['Utility', ['ping', 'userinfo', 'serverinfo', 'archive', 'help']],
];

interface RawOption {
  type: number;
  name: string;
  description: string;
  required?: boolean;
  options?: RawOption[];
}

interface RawCommandData {
  name: string;
  description: string;
  default_member_permissions?: string | null;
  options?: RawOption[];
}

function formatSubcommand(sub: RawOption): string {
  const args = (sub.options ?? [])
    .map(o => o.required ? `<${o.name}>` : `[${o.name}]`)
    .join(' ');
  return `\`${sub.name}${args ? ' ' + args : ''}\` — ${sub.description}`;
}

function formatOption(opt: RawOption): string {
  const req = opt.required ? '**required**' : '*optional*';
  const type = OPTION_TYPE_NAMES[opt.type] ?? 'Unknown';
  return `\`${opt.name}\` ${req} \`[${type}]\` — ${opt.description}`;
}

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show help for bot commands')
  .addStringOption(opt => opt
    .setName('command')
    .setDescription('Command to get detailed info for')
    .setRequired(false)
    .setAutocomplete(true));

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const client = interaction.client as BotClient;
  const focused = interaction.options.getFocused().toLowerCase();
  const choices = [...client.commands.keys()]
    .filter(name => name.startsWith(focused))
    .slice(0, 25)
    .map(name => ({ name, value: name }));
  await interaction.respond(choices);
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const client = interaction.client as BotClient;
  const commandName = interaction.options.getString('command');

  if (commandName) {
    const command = client.commands.get(commandName);
    if (!command) {
      await interaction.reply({ content: `Unknown command: \`${commandName}\``, ephemeral: true });
      return;
    }

    const json = command.data.toJSON() as RawCommandData;
    const subcommands = (json.options ?? []).filter(o => o.type === 1 || o.type === 2);
    const options = (json.options ?? []).filter(o => o.type !== 1 && o.type !== 2);

    const embed = new EmbedBuilder()
      .setTitle(`/${json.name}`)
      .setDescription(json.description)
      .setColor(0x5865F2)
      .setTimestamp();

    if (subcommands.length > 0) {
      embed.addFields({
        name: 'Subcommands',
        value: subcommands.map(formatSubcommand).join('\n').slice(0, 1024),
      });
    }

    if (options.length > 0) {
      embed.addFields({
        name: 'Options',
        value: options.map(formatOption).join('\n').slice(0, 1024),
      });
    }

    if (json.default_member_permissions) {
      embed.setFooter({ text: 'Requires elevated permissions (see command description)' });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // Overview: all commands grouped by category
  const embed = new EmbedBuilder()
    .setTitle('meisbot — commands')
    .setColor(0x5865F2)
    .setFooter({ text: 'Use /help <command> for detailed info on a command' })
    .setTimestamp();

  for (const [category, names] of COMMAND_CATEGORIES) {
    const lines = names
      .map(name => {
        const cmd = client.commands.get(name);
        return cmd ? `\`/${name}\` — ${cmd.data.description}` : null;
      })
      .filter((l): l is string => l !== null)
      .join('\n');

    if (lines) embed.addFields({ name: category, value: lines });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
