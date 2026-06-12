import { Label, ComboBox, Input, ListBox } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaTimes } from 'react-icons/fa';

import { getSubjects } from '../../apis';
import { SUBJECT_CODES } from '../../constants/subject-codes';
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
	const [inputValue, setInputValue] = useState('');

	const subjectsQuery = useQuery({
		queryKey: ['subjects', { year: YEAR, term: selectedTerm }] as const,
		queryFn: ({ queryKey }) => getSubjects(queryKey[1]),
	});

	const subjectList =
		subjectsQuery.data?.map((s) => {
			if (typeof s === 'string') {
				const code = SUBJECT_CODES[s] || s;
				return { key: s, code: s, name: code !== s ? `${code} - ${s}` : s };
			}
			return { key: s.code, code: s.code, name: `${s.code} - ${s.name}` };
		}) ?? [];

	const [prevSubject, setPrevSubject] = useState(subject);
	const [prevSubjectsData, setPrevSubjectsData] = useState(subjectsQuery.data);

	if (subject !== prevSubject) {
		setPrevSubject(subject);
		if (subject === null) {
			setInputValue('');
		} else {
			const selected = subjectList.find((s) => s.code === subject);
			if (selected) {
				setInputValue(selected.name);
			}
		}
	}

	if (subjectsQuery.data !== prevSubjectsData) {
		setPrevSubjectsData(subjectsQuery.data);
		if (subject !== null) {
			const selected = subjectList.find((s) => s.code === subject);
			if (selected) {
				setInputValue(selected.name);
			}
		}
	}

	const filteredSubjects = subjectList.filter((item) =>
		item.name.toLowerCase().includes(inputValue.toLowerCase()),
	);

	const labelText = t('search.choose-subject') ?? 'Choose a subject area';

	return (
		<div className="mobile:w-96 flex w-full flex-col gap-1.5">
			<ComboBox
				selectedKey={subject}
				onSelectionChange={(key) => {
					onSubjectChange(key as string | null);
				}}
				inputValue={inputValue}
				onInputChange={(val) => {
					setInputValue(val);
					// If the user clears the input completely, reset the subject selection
					if (val === '') {
						onSubjectChange(null);
					}
				}}
				className="w-full"
				menuTrigger="focus"
				isDisabled={subjectsQuery.isPending}
				items={filteredSubjects}
			>
				<Label className="text-foreground/80 pl-1 text-xs leading-normal font-bold">
					{labelText}
				</Label>
				<ComboBox.InputGroup className="border-separator bg-content1 focus-within:ring-primary/20 flex h-11 w-full items-center rounded-2xl border px-4 transition-colors focus-within:ring-2">
					<FaSearch className="text-default-400 mr-3 size-4" />
					<Input
						aria-label={labelText}
						placeholder={
							subjectsQuery.isPending
								? t('search.loading') === 'search.loading'
									? 'Loading...'
									: t('search.loading')
								: labelText
						}
						className="text-foreground placeholder:text-default-400 h-auto w-full !border-0 !bg-transparent !p-0 !pl-1.5 text-sm !shadow-none focus:!border-0 focus:!bg-transparent focus:!shadow-none focus:!ring-0 focus:!outline-none focus-visible:!outline-none"
					/>
					{inputValue && (
						<button
							type="button"
							onClick={() => {
								setInputValue('');
								onSubjectChange(null);
							}}
							className="text-default-400 hover:text-foreground ml-2 rounded-full p-0.5 transition-colors"
							aria-label="Clear search"
						>
							<FaTimes className="size-4" />
						</button>
					)}
				</ComboBox.InputGroup>

				<ComboBox.Popover
					placement="bottom start"
					className="bg-content1 border-separator min-w-[240px] rounded-2xl border p-1 shadow-lg"
				>
					<ListBox
						className="max-h-60 overflow-y-auto outline-none"
						items={filteredSubjects}
						aria-label="Subject suggestions"
						aria-labelledby="subject-listbox-label"
						renderEmptyState={() => (
							<div className="text-default-400 p-4 text-center text-xs">
								{t('search.subject-not-found')}
							</div>
						)}
					>
						{(item) => (
							<ListBox.Item
								key={item.key}
								id={item.key}
								textValue={item.name}
								className="focus:bg-default-100 hover:bg-default-100/50 text-foreground cursor-pointer rounded-xl px-3 py-2 transition-colors outline-none"
							>
								{item.name}
							</ListBox.Item>
						)}
					</ListBox>
				</ComboBox.Popover>
			</ComboBox>
		</div>
	);
};
