export const TERMS = [
	{ alias: 'sem', name: 'Semester', period: 2 },
	{ alias: 'tri', name: 'Trimester', period: 3 },
	{ alias: 'summer', name: 'Summer School', period: 0 },
	{ alias: 'winter', name: 'Winter School', period: 0 },
	{ alias: 'elc', name: 'ELC Term', period: 3 },
	{ alias: 'term', name: 'Term', period: 4 },
	{ alias: 'ol', name: 'Online Teaching Period', period: 6 },
	{ alias: 'melb', name: 'Melb Teaching Period', period: 3 },
	{ alias: 'pce', name: 'PCE Term', period: 3 },
].reduce(
	(acc, { alias, name, period }) => {
		if (period === 0) {
			acc.push({ alias, name });
			return acc;
		}
		acc.push(
			...Array.from({ length: period }, (_, i) => ({
				alias: `${alias}${i + 1}`,
				name: `${name} ${i + 1}`,
			})),
		);
		return acc;
	},
	[] as Array<{ alias: string; name: string }>,
);
