import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { mkdirSync } from 'fs';
import { GuildSettings, CachedMessage, LogEventName, ALL_LOG_EVENTS } from '../types';
import { logger } from '../utils/logger';

const dbPath = path.resolve(process.env.DATABASE_PATH || './data/meisbot.db');
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

// Tables are created at module load so prepared statements below are always valid,
// even when this module is imported by deploy-commands.ts without calling initDb().
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS guilds (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    log_bots INTEGER NOT NULL DEFAULT 0,
    ignored_channels TEXT NOT NULL DEFAULT '[]',
    event_logs TEXT NOT NULL DEFAULT '{}',
    disabled_events TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
`);

const guildCache = new Map<string, GuildSettings>();

export function initDb(): void {
  logger.info('Database initialized');
}

function rowToSettings(row: Record<string, unknown>): GuildSettings {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    logBots: !!(row.log_bots as number),
    ignoredChannels: JSON.parse(row.ignored_channels as string),
    eventLogs: JSON.parse(row.event_logs as string),
    disabledEvents: JSON.parse(row.disabled_events as string),
  };
}

const stmts = {
  getGuild: db.prepare('SELECT * FROM guilds WHERE id = ?'),
  insertGuild: db.prepare('INSERT OR IGNORE INTO guilds (id, owner_id, log_bots, ignored_channels, event_logs, disabled_events) VALUES (?, ?, 0, ?, ?, ?)'),
  deleteGuild: db.prepare('DELETE FROM guilds WHERE id = ?'),
  updateEventLogs: db.prepare('UPDATE guilds SET event_logs = ? WHERE id = ?'),
  updateIgnoredChannels: db.prepare('UPDATE guilds SET ignored_channels = ? WHERE id = ?'),
  updateLogBots: db.prepare('UPDATE guilds SET log_bots = ? WHERE id = ?'),
  insertMessage: db.prepare('INSERT OR IGNORE INTO messages (id, author_id, guild_id, channel_id, content, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
  getMessage: db.prepare('SELECT * FROM messages WHERE id = ?'),
  deleteMessage: db.prepare('DELETE FROM messages WHERE id = ?'),
  updateMessage: db.prepare('UPDATE messages SET content = ? WHERE id = ?'),
  deleteOldMessages: db.prepare('DELETE FROM messages WHERE created_at < ?'),
};

export function getGuild(guildId: string): GuildSettings | null {
  if (guildCache.has(guildId)) return guildCache.get(guildId)!;
  const row = stmts.getGuild.get(guildId) as Record<string, unknown> | undefined;
  if (!row) return null;
  const settings = rowToSettings(row);
  guildCache.set(guildId, settings);
  return settings;
}

export function createGuild(guildId: string, ownerId: string): GuildSettings {
  const defaultEventLogs = Object.fromEntries(ALL_LOG_EVENTS.map(e => [e, '']));
  stmts.insertGuild.run(guildId, ownerId, '[]', JSON.stringify(defaultEventLogs), '[]');
  return getGuild(guildId) ?? {
    id: guildId,
    ownerId,
    logBots: false,
    ignoredChannels: [],
    eventLogs: defaultEventLogs,
    disabledEvents: [],
  };
}

export function getOrCreateGuild(guildId: string, ownerId: string): GuildSettings {
  return getGuild(guildId) ?? createGuild(guildId, ownerId);
}

export function deleteGuild(guildId: string): void {
  stmts.deleteGuild.run(guildId);
  guildCache.delete(guildId);
}

export function invalidateGuild(guildId: string): void {
  guildCache.delete(guildId);
}

export function setEventLog(guildId: string, channelId: string, events: LogEventName[]): void {
  const settings = getGuild(guildId);
  if (!settings) return;
  const eventLogs = { ...settings.eventLogs };
  for (const event of events) eventLogs[event] = channelId;
  stmts.updateEventLogs.run(JSON.stringify(eventLogs), guildId);
  invalidateGuild(guildId);
}

export function removeEventLog(guildId: string, events: LogEventName[]): void {
  setEventLog(guildId, '', events);
}

export function clearAllEventLogs(guildId: string): void {
  removeEventLog(guildId, ALL_LOG_EVENTS);
}

export function toggleIgnoreChannel(guildId: string, channelId: string): boolean {
  const settings = getGuild(guildId);
  if (!settings) return false;
  const channels = [...settings.ignoredChannels];
  const idx = channels.indexOf(channelId);
  if (idx !== -1) channels.splice(idx, 1);
  else channels.push(channelId);
  stmts.updateIgnoredChannels.run(JSON.stringify(channels), guildId);
  invalidateGuild(guildId);
  return idx === -1;
}

export function toggleLogBots(guildId: string): boolean {
  const settings = getGuild(guildId);
  if (!settings) return false;
  const newVal = !settings.logBots;
  stmts.updateLogBots.run(newVal ? 1 : 0, guildId);
  invalidateGuild(guildId);
  return newVal;
}

export function resetGuild(guildId: string, ownerId: string): GuildSettings {
  deleteGuild(guildId);
  return createGuild(guildId, ownerId);
}

export function cacheMessage(msg: CachedMessage): void {
  stmts.insertMessage.run(msg.id, msg.authorId, msg.guildId, msg.channelId, msg.content, msg.createdAt);
}

export function getMessage(id: string): CachedMessage | null {
  const row = stmts.getMessage.get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    guildId: row.guild_id as string,
    channelId: row.channel_id as string,
    content: row.content as string,
    createdAt: row.created_at as number,
  };
}

export function getMessagesByIds(ids: string[]): CachedMessage[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM messages WHERE id IN (${placeholders})`).all(...ids) as Record<string, unknown>[];
  return rows.map(row => ({
    id: row.id as string,
    authorId: row.author_id as string,
    guildId: row.guild_id as string,
    channelId: row.channel_id as string,
    content: row.content as string,
    createdAt: row.created_at as number,
  }));
}

export function deleteMessage(id: string): void {
  stmts.deleteMessage.run(id);
}

export function updateMessageContent(id: string, content: string): void {
  stmts.updateMessage.run(content, id);
}

export function cleanOldMessages(): void {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const result = stmts.deleteOldMessages.run(cutoff);
  if ((result as { changes: number }).changes > 0) {
    logger.debug(`Cleaned ${(result as { changes: number }).changes} old messages`);
  }
}
