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

	return (
		<div className="mobile:bottom-3 mobile:right-3 fixed right-8 bottom-8 z-50 flex flex-col gap-2">
			<Tooltip content={t('zoom.zoom-in')} placement="left">
				<Button
					onClick={() => setHeight((h) => h + 0.5)}
					isDisabled={height === MAX_HOUR_HEIGHT}
					isIconOnly
					size="sm"
				>
					<FaPlus />
				</Button>
			</Tooltip>
			<Tooltip content={t('zoom.zoom-out')} placement="left">
				<Button
					onClick={() => setHeight((h) => h - 0.5)}
					isDisabled={height === MIN_HOUR_HEIGHT}
					isIconOnly
					size="sm"
				>
					<FaMinus />
				</Button>
			</Tooltip>
		</div>
	);
};
