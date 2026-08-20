export type TerminologyProfile = 'CER' | 'TNR' | 'TNVR';

interface TerminologySet {
	profile: TerminologyProfile;
	label: string;
	description: string;
	terms: {
		programName: string;
		programNameFull: string;
		capture: string;
		sterilize: string;
		return: string;
		vaccinate: string;
		colony: string;
		feeder: string;
		caretaker: string;
		campaign: string;
		trapBank: string;
		ear_tip: string;
		strayPopulation: string;
		regulatoryBody: string;
		regulatoryLaw: string;
	};
}

const TERMINOLOGY_PROFILES: Record<TerminologyProfile, TerminologySet> = {
	CER: {
		profile: 'CER',
		label: 'CER (Captura-Esterilización-Retorno)',
		description: 'Terminología utilizada en España según la Ley 7/2023',
		terms: {
			programName: 'CER',
			programNameFull: 'Captura-Esterilización-Retorno',
			capture: 'Captura',
			sterilize: 'Esterilización',
			return: 'Retorno',
			vaccinate: 'Vacunación',
			colony: 'Colonia felina',
			feeder: 'Alimentador/a',
			caretaker: 'Persona cuidadora',
			campaign: 'Campaña CER',
			trapBank: 'Banco de jaulas',
			ear_tip: 'Muesca en oreja',
			strayPopulation: 'Población felina urbana',
			regulatoryBody: 'Comunidad Autónoma / Ayuntamiento',
			regulatoryLaw: 'Ley 7/2023'
		}
	},
	TNR: {
		profile: 'TNR',
		label: 'TNR (Trap-Neuter-Return)',
		description: 'International terminology used in UK, Ireland, and most anglophone programs',
		terms: {
			programName: 'TNR',
			programNameFull: 'Trap-Neuter-Return',
			capture: 'Trap',
			sterilize: 'Neuter',
			return: 'Return',
			vaccinate: 'Vaccinate',
			colony: 'Cat colony',
			feeder: 'Colony feeder',
			caretaker: 'Colony caretaker',
			campaign: 'TNR campaign',
			trapBank: 'Trap bank',
			ear_tip: 'Ear tip',
			strayPopulation: 'Feral cat population',
			regulatoryBody: 'Local authority',
			regulatoryLaw: 'Animal Welfare Act'
		}
	},
	TNVR: {
		profile: 'TNVR',
		label: 'TNVR (Trap-Neuter-Vaccinate-Return)',
		description: 'Extended terminology used in the US, includes mandatory vaccination step',
		terms: {
			programName: 'TNVR',
			programNameFull: 'Trap-Neuter-Vaccinate-Return',
			capture: 'Trap',
			sterilize: 'Neuter/Spay',
			return: 'Return',
			vaccinate: 'Vaccinate (rabies)',
			colony: 'Managed colony',
			feeder: 'Colony manager',
			caretaker: 'Colony caretaker',
			campaign: 'TNVR event',
			trapBank: 'Trap library',
			ear_tip: 'Ear tip',
			strayPopulation: 'Community cat population',
			regulatoryBody: 'County / City animal control',
			regulatoryLaw: 'Local TNVR ordinance'
		}
	}
};

const COUNTRY_PROFILE_MAP: Record<string, TerminologyProfile> = {
	ES: 'CER',
	PT: 'CER',
	IT: 'TNR',
	FR: 'TNR',
	DE: 'TNR',
	GB: 'TNR',
	IE: 'TNR',
	US: 'TNVR',
	CA: 'TNVR',
	AU: 'TNR',
	NZ: 'TNR',
	BR: 'CER',
	PL: 'TNR',
	CZ: 'TNR',
	SE: 'TNR',
	NO: 'TNR',
	DK: 'TNR',
	CH: 'TNR'
};

export function getTerminologyProfile(country: string): TerminologySet {
	const profile = COUNTRY_PROFILE_MAP[country.toUpperCase()] ?? 'CER';
	return TERMINOLOGY_PROFILES[profile];
}

export function getTerminology(country: string): TerminologySet['terms'] {
	return getTerminologyProfile(country).terms;
}

export function getProfileForCountry(country: string): TerminologyProfile {
	return COUNTRY_PROFILE_MAP[country.toUpperCase()] ?? 'CER';
}

export function getAllProfiles(): TerminologySet[] {
	return Object.values(TERMINOLOGY_PROFILES);
}

export function term(country: string, key: keyof TerminologySet['terms']): string {
	return getTerminology(country)[key];
}
