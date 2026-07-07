// Profile help compatibility route: redirects old profile help links to the app help page.
import { redirect } from '@sveltejs/kit';

export const load = () => {
	redirect(307, '/help');
};
