// Pure menu/submenu length auditing for the QA sweep.
export type MenuDescriptor = { name: string; itemCount: number };
export type MenuFlag = { name: string; itemCount: number; reason: 'too-short' };
export const MIN_MENU_ITEMS = 2;

// Flags any menu/submenu with fewer than MIN_MENU_ITEMS items (Req 10.3).
export function flagShortMenus(menus: MenuDescriptor[]): MenuFlag[] {
	return menus
		.filter((menu) => menu.itemCount < MIN_MENU_ITEMS)
		.map((menu) => ({ name: menu.name, itemCount: menu.itemCount, reason: 'too-short' }));
}
