import { Select, SelectItem } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { LocalStorageKey } from '../../constants/local-storage-keys';
import { TERMS } from '../../constants/terms';

interface TermSelectorProps {
	selectedTerm: string;
	onTermChange: (term: string) => void;
	isDisabled: boolean;
}

export const TermSelector = ({
	selectedTerm,
	onTermChange,
	isDisabled,
}: TermSelectorProps) => {
	const { t } = useTranslation();

	const changeTerm = (term: string) => {
		onTermChange(term);
		localStorage.setItem(LocalStorageKey.Term, term);
	};

	return (
		<div
			onClick={() => {
				if (!isDisabled) return;
				toast.warning(t('toast.drop-to-change-term'));
			}}
		>
			<Select
				label={t('search.select-term')}
				selectedKeys={[selectedTerm]}
				onSelectionChange={(keys) => changeTerm(keys.currentKey!)}
				className="mobile:w-full w-56"
				isDisabled={isDisabled}
				disallowEmptySelection
			>
				{TERMS.map((term) => (
					<SelectItem key={term.alias} textValue={term.name}>
						{term.name}
					</SelectItem>
				))}
			</Select>
		</div>
	);
};
