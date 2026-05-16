# Changelog

## meisbot vs curtisf/logger

meisbot started as a fork of [curtisf/logger](https://github.com/curtisf/logger) and has been substantially rewritten. This document covers what changed and why.

---

### Stack

| Area | curtisf/logger | meisbot |
|------|---------------|---------|
| Database | PostgreSQL + Redis | SQLite via `node:sqlite` (Node.js 26 built-in) |
| ORM | Drizzle | Raw prepared statements |
| Native addons | better-sqlite3 (breaks on Node 26) | None |
| Discord.js | v13/v14 | v14.16+ throughout |

**Why `node:sqlite`?** better-sqlite3 uses V8 native APIs that broke in Node.js 26 (`GetPrototype` → `GetPrototypeV2`). `node:sqlite` is built into Node.js 26 and requires no compilation.

---

### New: moderation commands

None of these existed in curtisf/logger.

- **`/kick`** — kicks with role hierarchy check, DMs the user first
- **`/ban`** — bans members or non-members by user ID, optional message deletion
- **`/unban`** — unbans by user ID with reason
- **`/timeout`** — applies or removes a timeout with human-friendly duration input (`10m`, `1h30m`, `7d`)
- **`/warn` / `/warnings` / `/delwarn`** — full warning system backed by SQLite, DMs on warn
- **`/purge`** — bulk delete up to 100 messages, optionally filtered by user
- **`/lock` / `/unlock`** — toggle @everyone SendMessages permission
- **`/slowmode`** — set or disable channel slowmode with duration input

### New: utility commands

- **`/avatar`** — shows global and server avatar side-by-side when they differ
- **`/banner`** — shows a user's profile banner
- **`/roleinfo`** — color, member count, permissions, position, hoisted/mentionable flags
- **`/botinfo`** — uptime, guild count, command count, Node.js version, WS ping
- **`/archive [count]`** — saves 5–100 recent messages from the current channel as a `.txt` attachment (curtisf had no archive command)
- **`/help [command]`** — command overview with autocomplete, or detailed info for a single command

### New: fun commands

- **`/8ball`** — magic 8-ball with color-coded answers (green/yellow/red)
- **`/coinflip`** — heads or tails
- **`/choose`** — picks randomly from a comma-separated list, highlights the picked option
- **`/poll`** — creates a yes/no poll or custom poll (up to 10 options via `|`), auto-reacts with emojis

### New: auto-deploy webhook

- `deploy/webhook.js` listens on port 9001 for GitHub push events
- Validates HMAC-SHA256 signature, then runs `git pull → npm install → npm run build → pm2 restart`
- Replaces a GitHub Actions SSH-based approach with a simpler self-hosted webhook

---

### Improved event handlers

#### `channelUpdate`
- Added slowmode diff (`rateLimitPerUser`)
- Added bitrate diff (voice channels)
- Added NSFW toggle diff
- Fixed: position-only changes no longer produce empty embeds

#### `guildRoleUpdate`
- Granular permission diff — shows each permission added (`+ Name`) or removed (`− Name`) instead of just "permissions changed"

#### `guildEmojisUpdate`
- Uses `GuildEmojiCreate`, `GuildEmojiDelete`, `GuildEmojiUpdate` Discord events with individual embeds and emoji thumbnails
- curtisf/logger had this disabled

#### `guildMemberUpdate`
- Added timeout tracking — logs when a moderator applies or removes a timeout, including expiry and executor

#### `voiceStateUpdate`
- Added server-deafen detection (`serverDeaf`); curtisf only tracked server-mute

#### logBots consistency
- All event handlers (including role create/delete/update) consistently respect the `logBots` setting

---

### Architecture

- **Auto-loader** — events and commands are loaded automatically from the filesystem. No imports or registration needed when adding a new file.
- **`sendLog()`** — central dispatch. Checks per-guild event config, ignored channels, and bot filter. All handlers call this; none post directly.
- **`executorInfo()`** — safe helper for audit log executors. Handles `User | PartialUser | null | undefined` — needed because discord.js v14.16 changed `username` to `string | null`.
- **`guildCache`** — in-memory Map of guild settings. Reduces DB reads on busy servers; invalidated on any settings write.
- **Presets** — `/log set all` maps to all 24 events. Eight named presets let admins configure logging with a single command.
- **`parseDuration()`** — shared utility that turns `"10m"`, `"1h30m"`, `"7d"` into milliseconds. Used by `/timeout` and `/slowmode`.
