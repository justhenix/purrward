// Purrdocs docs file: generated documentation engine code.
import { redirect } from '@sveltejs/kit';

export const load = () => {
	throw redirect(307, '/docs/latest');
};
