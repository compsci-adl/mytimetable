import { Label, ListBox, Select } from '@heroui/react';
import { FaChevronDown } from 'react-icons/fa';

interface YearSelectProps {
	value: number | null;
	options: number[];
	onChange: (year: number) => void;
	disabled?: boolean;
}

export const YearSelect = ({
	value,
	options,
	onChange,
	disabled = false,
}: YearSelectProps) => {
	const selectedKey = value ? String(value) : undefined;

	return (
		<div className="mobile:w-36 w-full">
			<div className="flex flex-col gap-1.5">
				<Label
					id="year-label"
					className="text-foreground/80 pl-1 text-xs leading-normal font-bold"
				>
					Select a year
				</Label>
				<Select
					aria-labelledby="year-label"
					selectedKey={selectedKey}
					isDisabled={disabled}
					onSelectionChange={(val) => {
						if (val) {
							onChange(Number(val));
						}
					}}
				>
					<Select.Trigger className="border-separator bg-content1 flex h-11 w-full cursor-pointer items-center justify-between rounded-2xl border px-4 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50">
						<Select.Value>
							{({ selectedText }) =>
								disabled ? (
									<span className="text-default-400">Loading...</span>
								) : (
									selectedText || (value ? String(value) : '')
								)
							}
						</Select.Value>
						<Select.Indicator>
							<FaChevronDown className="text-default-500 text-xs" />
						</Select.Indicator>
					</Select.Trigger>
					<Select.Popover className="bg-content1 border-separator min-w-36 rounded-2xl border p-1 shadow-lg">
						<ListBox
							className="outline-none"
							items={options.map((y) => ({ key: String(y), name: String(y) }))}
						>
							{(item) => (
								<ListBox.Item
									key={item.key}
									id={item.key}
									textValue={item.name}
									className="focus:bg-default-100 hover:bg-default-100/50 text-foreground relative flex cursor-pointer items-center rounded-xl py-2 pr-3 pl-9 transition-colors outline-none"
								>
									<ListBox.ItemIndicator className="text-primary absolute left-3 hidden h-4 w-4 items-center justify-center font-bold data-[visible=true]:flex">
										✓
									</ListBox.ItemIndicator>
									<span className="select-none">{item.name}</span>
								</ListBox.Item>
							)}
						</ListBox>
					</Select.Popover>
				</Select>
			</div>
		</div>
	);
};

export const YearSelector = YearSelect;
