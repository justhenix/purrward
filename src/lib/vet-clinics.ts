// Static mock clinic directory for the vet-visit-help mode.

export type Clinic = { id: string; name: string; specialty: string; distanceKm: number };

export const CLINICS: Clinic[] = [
	{
		id: 'whiskers-wellness',
		name: 'Whiskers Wellness Clinic',
		specialty: 'General Practice',
		distanceKm: 1.2
	},
	{
		id: 'purr-and-paw',
		name: 'Purr & Paw Feline Care',
		specialty: 'Feline Medicine',
		distanceKm: 2.8
	},
	{
		id: 'nine-lives-emergency',
		name: 'Nine Lives Emergency Vets',
		specialty: 'Emergency & Critical Care',
		distanceKm: 4.5
	},
	{
		id: 'cozy-coat-derm',
		name: 'Cozy Coat Skin & Fur',
		specialty: 'Dermatology',
		distanceKm: 6.1
	}
];
