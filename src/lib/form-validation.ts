// Client-side helpers for replacing native validation bubbles with app-styled messages.
export type FieldWarnings = Record<string, string | undefined>;

export function fieldWarning(input: HTMLInputElement, label: string): string | undefined {
	const validity = input.validity;
	if (validity.valueMissing) return `${label} is required.`;
	if (validity.typeMismatch) return `Enter a valid ${label.toLowerCase()}.`;
	if (validity.tooShort) return `Use at least ${input.minLength} characters.`;
	if (validity.tooLong) return `Use ${input.maxLength} characters or fewer.`;
	if (!validity.valid) return `Check ${label.toLowerCase()}.`;
	return undefined;
}

export function formInput(form: HTMLFormElement, name: string): HTMLInputElement | null {
	const input = form.elements.namedItem(name);
	return input instanceof HTMLInputElement ? input : null;
}
