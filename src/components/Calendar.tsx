import { Button } from '@nextui-org/react';
import { useEffect } from 'react';

import { useCalendar } from '../helpers/calendar';

export const Calendar = () => {
	const { courses, currentWeek, nextWeek, prevWeek } = useCalendar();
	useEffect(() => {
		console.log(courses);
	});

	return (
		<div>
			<h1>{currentWeek.format('MMMM D, YYYY')}</h1>
			<Button
				isIconOnly
				variant="light"
				className="text-2xl"
				onClick={prevWeek}
			>
				⬅️
			</Button>
			<Button
				isIconOnly
				variant="light"
				className="text-2xl"
				onClick={nextWeek}
			>
				➡️
			</Button>
		</div>
	);
};
