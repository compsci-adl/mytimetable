import { Label, ListBox, Select } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';
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
			className="mobile:w-56 w-full"
			onClick={() => {
				if (!isDisabled) return;
				toast.warning(t('toast.drop-to-change-term'));
			}}
		>
			<div className="flex flex-col gap-1.5">
				<Label
					id="term-label"
					className="text-foreground/80 pl-1 text-xs leading-normal font-bold"
				>
					{t('search.select-term')}
				</Label>
				<Select
					isDisabled={isDisabled}
					aria-labelledby="term-label"
					selectedKey={selectedTerm}
					onSelectionChange={(val) => {
						if (val) {
							changeTerm(String(val));
						}
					}}
				>
					<Select.Trigger className="border-separator bg-content1 flex h-11 w-full cursor-pointer items-center justify-between rounded-2xl border px-4 text-left text-sm font-medium transition-colors">
						<Select.Value>{({ selectedText }) => selectedText}</Select.Value>
						<Select.Indicator>
							<FaChevronDown className="text-default-500 text-xs" />
						</Select.Indicator>
					</Select.Trigger>
					<Select.Popover className="bg-content1 border-separator min-w-[224px] rounded-2xl border p-1 shadow-lg">
						<ListBox className="outline-none" items={TERMS}>
							{(term) => (
								<ListBox.Item
									key={term.alias}
									id={term.alias}
									textValue={term.name}
									className="focus:bg-default-100 hover:bg-default-100/50 text-foreground relative flex cursor-pointer items-center rounded-xl py-2 pr-3 pl-9 transition-colors outline-none"
								>
									<ListBox.ItemIndicator className="text-primary absolute left-3 hidden h-4 w-4 items-center justify-center font-bold data-[visible=true]:flex">
										✓
									</ListBox.ItemIndicator>
									<span className="select-none">{term.name}</span>
								</ListBox.Item>
							)}
						</ListBox>
					</Select.Popover>
				</Select>
			</div>
		</div>
	);
};
