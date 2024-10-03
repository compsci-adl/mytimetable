import { Button, Tooltip } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';

import {
	MAX_HOUR_HEIGHT,
	MIN_HOUR_HEIGHT,
	useCalendarHourHeight,
} from '../helpers/calendar-hour-height';

export const ZoomButtons = () => {
	const { t } = useTranslation();

	const { height, setHeight } = useCalendarHourHeight();

	return (
		<div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-2 mobile:bottom-3 mobile:right-3">
			<Tooltip content={t('zoom.zoom-in')} placement="left">
				<Button
					onClick={() => setHeight((h) => h + 0.5)}
					isDisabled={height === MAX_HOUR_HEIGHT}
					isIconOnly
					size="sm"
				>
					➕
				</Button>
			</Tooltip>
			<Tooltip content={t('zoom.zoom-out')} placement="left">
				<Button
					onClick={() => setHeight((h) => h - 0.5)}
					isDisabled={height === MIN_HOUR_HEIGHT}
					isIconOnly
					size="sm"
				>
					➖
				</Button>
			</Tooltip>
		</div>
	);
};
