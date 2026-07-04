// Resolves the profile avatar: chosen cat art, else the Google account photo, else a letter.
import { getCatAvatar } from './cat-avatars';
import { isRenderableAvatarUrl } from './avatar-url';
import { avatarInitial } from './account-identity';
import type { AvatarChoice } from './avatar-ids';

type Identity =
	| {
			displayName?: string | null;
			email?: string | null;
			avatarUrl?: string | null;
	  }
	| null
	| undefined;

export type ProfileAvatar =
	| { kind: 'image'; src: string; cat: boolean }
	| { kind: 'letter'; letter: string };

export function resolveProfileAvatar(user: Identity, avatarChoice: AvatarChoice): ProfileAvatar {
	const cat = getCatAvatar(avatarChoice);
	if (cat) return { kind: 'image', src: cat.src, cat: true };
	if (user && isRenderableAvatarUrl(user.avatarUrl)) {
		return { kind: 'image', src: user.avatarUrl, cat: false };
	}
	return { kind: 'letter', letter: avatarInitial(user) };
}
