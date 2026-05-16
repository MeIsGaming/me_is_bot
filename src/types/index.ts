import { Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';

export interface BotClient extends Client {
  commands: Collection<string, Command>;
}

export interface Command {
  data: Pick<SlashCommandBuilder, 'name' | 'description' | 'toJSON'>;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

export type LogEventName =
  | 'channelCreate' | 'channelUpdate' | 'channelDelete'
  | 'guildBanAdd' | 'guildBanRemove'
  | 'guildRoleCreate' | 'guildRoleDelete' | 'guildRoleUpdate'
  | 'guildUpdate'
  | 'messageDelete' | 'messageDeleteBulk' | 'messageUpdate'
  | 'guildMemberAdd' | 'guildMemberKick' | 'guildMemberRemove'
  | 'guildMemberUpdate' | 'guildMemberNickUpdate' | 'guildMemberVerify' | 'guildMemberBoostUpdate'
  | 'voiceChannelLeave' | 'voiceChannelJoin' | 'voiceStateUpdate' | 'voiceChannelSwitch'
  | 'guildEmojisUpdate';

export const ALL_LOG_EVENTS: LogEventName[] = [
  'channelCreate', 'channelUpdate', 'channelDelete',
  'guildBanAdd', 'guildBanRemove',
  'guildRoleCreate', 'guildRoleDelete', 'guildRoleUpdate',
  'guildUpdate',
  'messageDelete', 'messageDeleteBulk', 'messageUpdate',
  'guildMemberAdd', 'guildMemberKick', 'guildMemberRemove',
  'guildMemberUpdate', 'guildMemberNickUpdate', 'guildMemberVerify', 'guildMemberBoostUpdate',
  'voiceChannelLeave', 'voiceChannelJoin', 'voiceStateUpdate', 'voiceChannelSwitch',
  'guildEmojisUpdate',
];

export const EVENT_DESCRIPTIONS: Record<LogEventName, string> = {
  channelCreate: 'Triggered when a channel is created. Shows type, name, permission overwrites, and the creator.',
  channelUpdate: 'Triggered when a channel is updated. Logs name, topic, nsfw, slowmode, bitrate, permission overwrite changes, and who made the change.',
  channelDelete: 'Triggered when a channel is deleted. Shows type, name, creation date, and who deleted it.',
  guildBanAdd: 'Triggered when a member is banned. Shows the banned user, reason, and who performed the ban.',
  guildBanRemove: 'Triggered when a member is unbanned. Shows the user, reason, and who performed the unban.',
  guildRoleCreate: 'Triggered when a role is created. Shows role name, color, permissions, and who created it.',
  guildRoleDelete: 'Triggered when a role is deleted. Shows role name, color, and who deleted it.',
  guildRoleUpdate: 'Triggered when a role is updated. Shows what changed (name, color, permissions, hoist, mentionable) and who changed it.',
  guildUpdate: 'Triggered when server settings are changed. Logs AFK channel, verification level, icon, name, locale, content filter, and more.',
  messageDelete: 'Triggered when a message is deleted. Shows cached message content and author. Bot messages are excluded by default.',
  messageDeleteBulk: 'Triggered when messages are bulk-deleted. Attaches a text file with the cached messages.',
  messageUpdate: 'Triggered when a message is edited. Shows old and new content with a jump link.',
  guildMemberAdd: 'Triggered when a user joins the server. Shows account age, invite used (requires Manage Channels + Manage Server), and member count.',
  guildMemberKick: 'Triggered when a member is kicked. Shows the kicked member, their roles, reason, and who performed the kick.',
  guildMemberRemove: 'Triggered when a member leaves the server. Shows their roles and time spent in the server.',
  guildMemberUpdate: 'Triggered when a member has roles added/removed or is timed out. Shows the change and who made it.',
  guildMemberNickUpdate: 'Triggered when a member\'s nickname changes.',
  guildMemberVerify: 'Triggered when a member passes membership screening.',
  guildMemberBoostUpdate: 'Triggered when a member starts or stops boosting the server.',
  voiceChannelJoin: 'Triggered when a member joins a voice channel.',
  voiceChannelLeave: 'Triggered when a member leaves a voice channel.',
  voiceChannelSwitch: 'Triggered when a member moves between voice channels.',
  voiceStateUpdate: 'Triggered when a member is server-muted or server-deafened. Shows who performed the action.',
  guildEmojisUpdate: 'Triggered when an emoji is created, deleted, or updated. Shows the affected emoji and who changed it.',
};

export const PRESET_EVENT_MAP: Record<string, LogEventName[]> = {
  voice: ['voiceChannelLeave', 'voiceChannelJoin', 'voiceChannelSwitch', 'voiceStateUpdate'],
  message: ['messageUpdate', 'messageDelete', 'messageDeleteBulk'],
  member: ['guildMemberUpdate', 'guildMemberNickUpdate', 'guildMemberVerify', 'guildMemberBoostUpdate'],
  moderation: ['guildBanAdd', 'guildBanRemove', 'guildMemberKick'],
  joinlog: ['guildMemberAdd', 'guildMemberRemove'],
  server: ['guildUpdate'],
  role: ['guildRoleUpdate', 'guildRoleCreate', 'guildRoleDelete'],
  channel: ['channelCreate', 'channelUpdate', 'channelDelete'],
  all: ALL_LOG_EVENTS,
};

export interface GuildSettings {
  id: string;
  ownerId: string;
  logBots: boolean;
  ignoredChannels: string[];
  eventLogs: Record<string, string>;
  disabledEvents: string[];
}

export interface CachedMessage {
  id: string;
  authorId: string;
  guildId: string;
  channelId: string;
  content: string;
  createdAt: number;
}

export interface Warning {
  id: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: number;
}
