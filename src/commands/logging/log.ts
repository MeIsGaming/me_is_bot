import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  ChannelType, PermissionFlagsBits,
} from 'discord.js';
import {
  ALL_LOG_EVENTS, PRESET_EVENT_MAP, EVENT_DESCRIPTIONS, LogEventName,
} from '../../types';
import {
  getOrCreateGuild, setEventLog, removeEventLog, clearAllEventLogs,
  toggleIgnoreChannel, toggleLogBots, resetGuild,
} from '../../database';

export const data = new SlashCommandBuilder()
  .setName('log')
  .setDescription('Manage logging settings')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(sub => sub
    .setName('set')
    .setDescription('Set a channel to receive log events')
    .addChannelOption(opt => opt
      .setName('channel').setDescription('Target log channel').setRequired(true)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addStringOption(opt => opt
      .setName('events')
      .setDescription('Comma-separated events or preset name (voice/message/member/moderation/joinlog/server/role/channel/all). Default: all')
      .setRequired(false)))
  .addSubcommand(sub => sub
    .setName('remove')
    .setDescription('Remove log channel for events')
    .addStringOption(opt => opt
      .setName('events')
      .setDescription('Comma-separated events or preset. Default: all')
      .setRequired(false)))
  .addSubcommand(sub => sub
    .setName('list')
    .setDescription('Show current logging configuration'))
  .addSubcommand(sub => sub
    .setName('events')
    .setDescription('Show available log events and their descriptions')
    .addStringOption(opt => opt
      .setName('event')
      .setDescription('Specific event to look up')
      .setRequired(false)))
  .addSubcommand(sub => sub
    .setName('ignorechannel')
    .setDescription('Toggle ignoring a channel from logging')
    .addChannelOption(opt => opt
      .setName('channel')
      .setDescription('Channel to toggle (default: current channel)')
      .setRequired(false)))
  .addSubcommand(sub => sub
    .setName('logbots')
    .setDescription('Toggle logging of bot actions'))
  .addSubcommand(sub => sub
    .setName('reset')
    .setDescription('Reset all logging settings for this server')
    .addStringOption(opt => opt
      .setName('confirm')
      .setDescription('Type CONFIRM to proceed')
      .setRequired(true)));

function resolveEvents(input: string): LogEventName[] {
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  const resolved = new Set<LogEventName>();
  for (const part of parts) {
    if (PRESET_EVENT_MAP[part]) {
      PRESET_EVENT_MAP[part].forEach(e => resolved.add(e));
    } else if (ALL_LOG_EVENTS.includes(part as LogEventName)) {
      resolved.add(part as LogEventName);
    }
  }
  return [...resolved];
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  const settings = getOrCreateGuild(guild.id, guild.ownerId);

  if (sub === 'set') {
    const channel = interaction.options.getChannel('channel', true);
    const eventInput = interaction.options.getString('events') ?? 'all';
    const events = resolveEvents(eventInput);

    if (events.length === 0) {
      await interaction.reply({ content: `No valid events found in: \`${eventInput}\`\nUse a preset (voice/message/member/moderation/joinlog/server/role/channel/all) or event name.`, ephemeral: true });
      return;
    }

    setEventLog(guild.id, channel.id, events);
    await interaction.reply({ embeds: [new EmbedBuilder()
      .setDescription(`Set **${events.length}** event(s) to log in <#${channel.id}>`)
      .setColor(0x57F287)
      .setTimestamp()
      .addFields({ name: 'Events', value: events.join(', ') }),
    ], ephemeral: true });
    return;
  }

  if (sub === 'remove') {
    const eventInput = interaction.options.getString('events') ?? 'all';
    let events: LogEventName[];
    if (eventInput === 'all') {
      events = ALL_LOG_EVENTS;
      clearAllEventLogs(guild.id);
    } else {
      events = resolveEvents(eventInput);
      if (events.length === 0) {
        await interaction.reply({ content: `No valid events found: \`${eventInput}\``, ephemeral: true });
        return;
      }
      removeEventLog(guild.id, events);
    }
    await interaction.reply({ embeds: [new EmbedBuilder()
      .setDescription(`Removed logging for **${events.length}** event(s)`)
      .setColor(0xED4245)
      .setTimestamp()
      .addFields({ name: 'Events', value: events.join(', ') }),
    ], ephemeral: true });
    return;
  }

  if (sub === 'list') {
    const configured = ALL_LOG_EVENTS.filter(e => settings.eventLogs[e]);
    const unconfigured = ALL_LOG_EVENTS.filter(e => !settings.eventLogs[e]);

    const embed = new EmbedBuilder()
      .setTitle('Logging configuration')
      .setColor(0x5865F2)
      .setTimestamp()
      .setFooter({ text: `${configured.length}/${ALL_LOG_EVENTS.length} events configured | Bot logging: ${settings.logBots ? 'on' : 'off'}` });

    if (configured.length > 0) {
      // Group by channel
      const byChannel = new Map<string, string[]>();
      for (const e of configured) {
        const cid = settings.eventLogs[e];
        byChannel.set(cid, [...(byChannel.get(cid) ?? []), e]);
      }
      for (const [cid, evts] of byChannel) {
        embed.addFields({ name: `<#${cid}>`, value: evts.join(', ') });
      }
    }

    if (unconfigured.length > 0) {
      embed.addFields({ name: 'Not configured', value: unconfigured.join(', ') });
    }

    if (settings.ignoredChannels.length > 0) {
      embed.addFields({ name: 'Ignored channels', value: settings.ignoredChannels.map(c => `<#${c}>`).join(', ') });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (sub === 'events') {
    const eventName = interaction.options.getString('event');

    if (eventName) {
      const desc = EVENT_DESCRIPTIONS[eventName as LogEventName];
      if (!desc) {
        await interaction.reply({ content: `Unknown event: \`${eventName}\``, ephemeral: true });
        return;
      }
      await interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle(eventName)
        .setDescription(desc)
        .setColor(0x5865F2)
        .setTimestamp(),
      ], ephemeral: true });
      return;
    }

    const presets = Object.entries(PRESET_EVENT_MAP)
      .filter(([k]) => k !== 'all')
      .map(([k, v]) => `**${k}**: ${v.join(', ')}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Available log events')
      .setColor(0x5865F2)
      .setDescription(`**All events:** ${ALL_LOG_EVENTS.join(', ')}`)
      .addFields({ name: 'Presets', value: presets })
      .setFooter({ text: 'Use /log events <event> for a detailed description' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (sub === 'ignorechannel') {
    const target = interaction.options.getChannel('channel') ?? interaction.channel;
    if (!target) return;
    const nowIgnored = toggleIgnoreChannel(guild.id, target.id);
    await interaction.reply({ embeds: [new EmbedBuilder()
      .setDescription(`<#${target.id}> is now **${nowIgnored ? 'ignored' : 'no longer ignored'}**`)
      .setColor(nowIgnored ? 0xFEE75C : 0x57F287)
      .setTimestamp(),
    ], ephemeral: true });
    return;
  }

  if (sub === 'logbots') {
    const nowLogging = toggleLogBots(guild.id);
    await interaction.reply({ embeds: [new EmbedBuilder()
      .setDescription(`Bot logging is now **${nowLogging ? 'enabled' : 'disabled'}**`)
      .setColor(nowLogging ? 0x57F287 : 0xED4245)
      .setTimestamp(),
    ], ephemeral: true });
    return;
  }

  if (sub === 'reset') {
    const confirm = interaction.options.getString('confirm', true);
    if (confirm !== 'CONFIRM') {
      await interaction.reply({ content: 'Type exactly `CONFIRM` to reset all logging settings.', ephemeral: true });
      return;
    }
    resetGuild(guild.id, guild.ownerId);
    await interaction.reply({ embeds: [new EmbedBuilder()
      .setDescription('All logging settings have been reset.')
      .setColor(0xED4245)
      .setTimestamp(),
    ], ephemeral: true });
  }
}
