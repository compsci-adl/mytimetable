import { Button, Tooltip } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FaMinus, FaPlus } from 'react-icons/fa';

import {
	MAX_HOUR_HEIGHT,
	MIN_HOUR_HEIGHT,
	useCalendarHourHeight,
} from '../helpers/calendar-hour-height';

export const ZoomButtons = () => {
	const { t } = useTranslation();

	const { height, setHeight } = useCalendarHourHeight();

	const isMax = height === MAX_HOUR_HEIGHT;
	const isMin = height === MIN_HOUR_HEIGHT;

	return (
		<div className="fixed right-3 bottom-2 z-50 flex flex-col gap-2 md:right-20 md:bottom-8">
			<Tooltip>
				<Tooltip.Trigger>
					<Button
						onPress={isMax ? undefined : () => setHeight((h) => h + 0.5)}
						isIconOnly
						size="sm"
						isDisabled={isMax}
						className="bg-content1 hover:bg-default-100 border-separator text-foreground rounded-full border shadow-md disabled:opacity-30"
					>
						<FaPlus />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content placement="left">{t('zoom.zoom-in')}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<Tooltip.Trigger>
					<Button
						onPress={isMin ? undefined : () => setHeight((h) => h - 0.5)}
						isIconOnly
						size="sm"
						isDisabled={isMin}
						className="bg-content1 hover:bg-default-100 border-separator text-foreground rounded-full border shadow-md disabled:opacity-30"
					>
						<FaMinus />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content placement="left">{t('zoom.zoom-out')}</Tooltip.Content>
			</Tooltip>
		</div>
	);
};
