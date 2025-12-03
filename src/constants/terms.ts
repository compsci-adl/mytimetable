export const TERMS = [
	{ alias: 'sem', name: 'Semester', period: 2 },
	{ alias: 'summer', name: 'Summer', period: 0 },
	{ alias: 'winter', name: 'Winter', period: 0 },
	{ alias: 'online', name: 'Online Term', period: 4 },
	{ alias: 'term', name: 'Term', period: 4 },
	{ alias: 'uao', name: 'UAO Teaching Period', period: 6 },
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
