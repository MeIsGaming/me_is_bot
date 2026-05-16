# Changelog

## meisbot vs curtisf/logger

meisbot started as a fork of [curtisf/logger](https://github.com/curtisf/logger) and has been substantially rewritten. Here's what changed.

---

### Stack

| Area | curtisf/logger | meisbot |
|------|---------------|---------|
| Database | PostgreSQL + Redis | SQLite via `node:sqlite` (Node.js 26 built-in) |
| ORM | Drizzle | Raw prepared statements |
| Native addons | better-sqlite3 (breaks on Node 26) | None |
| Discord.js | v13/v14 | v14 throughout |

The switch to `node:sqlite` was necessary because better-sqlite3 uses V8 native APIs that broke in Node.js 26 (`GetPrototype` → `GetPrototypeV2`). `node:sqlite` is built into Node.js 26 and needs no compilation.

---

### New features not in curtisf/logger

- **`/archive [count]`** — Saves 5–100 recent messages from the current channel as a `.txt` file attachment. curtisf had no archive command.
- **`/help [command]`** — Lists all commands with autocomplete, or shows detailed info for a single command.
- **Invite tracking on join** — On member join, shows which invite code was used (requires Manage Channels + Manage Server permissions).
- **`guildDelete` cleanup** — When the bot is removed from a server, all guild data and the invite cache are purged from the DB.
- **`messageDeleteBulk` attachment** — Attaches a `.txt` file with recovered messages instead of posting to an external paste service.

---

### Improved event handlers

#### `channelUpdate`
- Added: slowmode diff (`rateLimitPerUser`)
- Added: bitrate diff (voice channels)
- Added: NSFW toggle diff
- Fixed: position-only changes no longer produce empty log messages

#### `guildRoleUpdate`
- Added: granular permission diff — shows individual permissions added (`+ PermName`) and removed (`− PermName`) instead of just flagging that permissions changed

#### `guildEmojisUpdate`
- Uses separate `GuildEmojiCreate`, `GuildEmojiDelete`, `GuildEmojiUpdate` Discord events with individual embeds and emoji thumbnail
- curtisf/logger had this disabled

#### `guildMemberUpdate`
- Added: timeout tracking — logs when a moderator applies or removes a timeout, including expiry time and executor

#### `voiceStateUpdate`
- Added: server-deafen detection (`serverDeaf`)
- curtisf only tracked server-mute

---

### Architecture changes

- **Auto-loader** — Events and commands are loaded automatically from the filesystem. No import or registration needed when adding a new event/command file.
- **`sendLog()`** — Central dispatch function. Checks per-guild event config, ignored channels, and bot filter before sending. All event handlers call this; none send directly.
- **`executorInfo()`** — Safe helper for audit log executors. Handles `User | PartialUser | null | undefined` — needed because discord.js v14.16 changed `username` to `string | null`.
- **`guildCache`** — In-memory Map of guild settings. Reduces DB reads on high-traffic servers; invalidated on any settings write.
- **Presets** — `/log set all` maps to all 24 events. Eight named presets (`voice`, `message`, `member`, `moderation`, `joinlog`, `server`, `role`, `channel`) let admins configure logging in one command.
