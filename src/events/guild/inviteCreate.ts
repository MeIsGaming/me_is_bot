import { Events, Invite } from 'discord.js';
import { BotClient } from '../../types';
import { addInvite } from '../../utils/inviteCache';

export const name = Events.InviteCreate;
export const once = false;

export async function execute(_client: BotClient, invite: Invite): Promise<void> {
  if (!invite.guild) return;
  addInvite(invite.guild.id, invite);
}
