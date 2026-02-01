import { Autocomplete, AutocompleteItem } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getSubjects } from '../../apis';
import { YEAR } from '../../constants/year';

interface SubjectSelectorProps {
	selectedTerm: string;
	subject: string | null;
	onSubjectChange: (subject: string | null) => void;
}

export const SubjectSelector = ({
	selectedTerm,
	subject,
	onSubjectChange,
}: SubjectSelectorProps) => {
	const { t } = useTranslation();

	const subjectsQuery = useQuery({
		queryKey: ['subjects', { year: YEAR, term: selectedTerm }] as const,
		queryFn: ({ queryKey }) => getSubjects(queryKey[1]),
	});

	const subjectList =
		subjectsQuery.data?.map((s) => {
			if (typeof s === 'string') {
				return { key: s, code: s, name: s };
			}
			return { key: s.code, code: s.code, name: `${s.code} - ${s.name}` };
		}) ?? [];

	return (
		<Autocomplete
			defaultItems={subjectList}
			label={t('search.choose-subject')}
			className="mobile:w-full w-96"
			selectedKey={subject}
			onSelectionChange={(key) => onSubjectChange(key as string)}
			listboxProps={{ emptyContent: t('search.subject-not-found') }}
		>
			{(subject) => (
				<AutocompleteItem key={subject.key} textValue={subject.name}>
					{subject.name}
				</AutocompleteItem>
			)}
		</Autocomplete>
	);
};
