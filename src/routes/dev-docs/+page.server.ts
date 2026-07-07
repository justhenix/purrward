// Developer docs entry route: keeps /dev-docs stable while Purrdocs serves /docs/latest.
import { redirect } from '@sveltejs/kit';

export const load = () => {
	redirect(307, '/docs/latest');
};
