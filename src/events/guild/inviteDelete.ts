import { Events, Invite } from 'discord.js';
import { BotClient } from '../../types';
import { removeInvite } from '../../utils/inviteCache';

export const name = Events.InviteDelete;
export const once = false;

export async function execute(_client: BotClient, invite: Invite): Promise<void> {
  if (!invite.guild) return;
  removeInvite(invite.guild.id, invite.code);
}
