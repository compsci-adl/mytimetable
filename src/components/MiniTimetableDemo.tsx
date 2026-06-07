import React from 'react';
import { FaPlus } from 'react-icons/fa';

const HOUR_PX = 56; // height of one hour slot in px
const START_HOUR = 9; // 9:00
const HOURS = [9, 10, 11, 12, 13]; // labels shown

type MiniCardProps = {
	top: number;
	height: number;
	color: 'blue' | 'purple';
	time: string;
	name: string;
	location: string;
	className?: string;
	style?: React.CSSProperties;
};

const MiniCard = ({
	top,
	height,
	color,
	time,
	name,
	location,
	className = '',
	style,
}: MiniCardProps) => {
	return (
		<div
			className={`absolute overflow-hidden rounded-2xl border-l-4 p-2 text-left text-xs shadow-sm transition-all duration-200 ${
				color === 'blue'
					? 'bg-apple-blue-300 border-apple-blue-500 text-apple-blue-700 dark:bg-apple-blue-300 dark:border-apple-blue-500 dark:text-white'
					: 'bg-apple-purple-300 border-apple-purple-500 text-apple-purple-700 dark:bg-apple-purple-300 dark:border-apple-purple-500 dark:text-white'
			} ${className}`}
			style={{
				top,
				height,
				left: 2,
				right: 2,
				...style,
			}}
		>
			<div className="text-[8.5px] font-semibold text-current opacity-95">
				{time}
			</div>
			<div className="pr-5 text-[10px] leading-tight font-black text-current">
				{name}
			</div>
			<div className="mt-0.5 pr-5 text-[8.5px] leading-tight text-current opacity-85">
				{location}
			</div>
			<div className="absolute right-2 bottom-2 flex h-6 w-6 items-center justify-center rounded-full bg-current/10 text-xs font-bold text-current transition-colors hover:bg-current/20">
				<FaPlus className="text-current" />
			</div>
		</div>
	);
};

export const MiniTimetableDemo = () => {
	// offset in px from top of the time-body for a given hour
	const hourOffset = (h: number) => (h - START_HOUR) * HOUR_PX;

	return (
		<div
			className="border-separator bg-content2/10 w-full overflow-hidden rounded-xl border shadow-inner select-none"
			style={{ fontFamily: 'Outfit Variable, sans-serif' }}
		>
			{/* Header row */}
			<div className="border-separator flex border-b" style={{ height: 28 }}>
				{/* corner */}
				<div
					className="border-separator shrink-0 border-r"
					style={{ width: 36 }}
				/>
				{['Mon 2', 'Tue 3', 'Wed 4'].map((day) => (
					<div
						key={day}
						className="border-separator text-default-500 flex flex-1 items-center justify-center border-r text-[11px] font-semibold"
					>
						{day}
					</div>
				))}
			</div>

			{/* Body: time labels + columns */}
			<div className="flex" style={{ height: HOUR_PX * (HOURS.length - 1) }}>
				{/* Time labels */}
				<div
					className="border-separator relative shrink-0 border-r"
					style={{ width: 36 }}
				>
					{HOURS.map((h) => (
						<div
							key={h}
							className="text-default-400 absolute w-full pr-1 text-right text-[9px]"
							style={{ top: hourOffset(h) - 5 }}
						>
							{h}:00
						</div>
					))}
				</div>

				{/* Mon column — drop target placeholder */}
				<div className="border-separator relative flex-1 border-r">
					{/* horizontal hour lines */}
					{HOURS.slice(1).map((h) => (
						<div
							key={h}
							className="border-separator absolute w-full border-t"
							style={{ top: hourOffset(h) }}
						/>
					))}
					{/* Animated drop-zone placeholder (Mon, 10:00–12:00) */}
					<div
						className="animate-dropzone-mon border-apple-blue-500 absolute overflow-hidden rounded-2xl border border-dashed"
						style={{
							top: hourOffset(10) + 2,
							height: HOUR_PX * 2 - 4,
							left: 2,
							right: 2,
						}}
					>
						<div className="text-apple-blue-700 dark:text-apple-blue-500 absolute top-1/2 w-full -translate-y-1/2 px-2 text-left text-[9px] font-semibold">
							Schutz, 214/218 | Adelaide City Campus East
						</div>
					</div>
				</div>

				{/* Tue column — source card (fades when dragging) */}
				<div className="border-separator relative flex-1 border-r">
					{HOURS.slice(1).map((h) => (
						<div
							key={h}
							className="border-separator absolute w-full border-t"
							style={{ top: hourOffset(h) }}
						/>
					))}
					{/* Source card — fades out while its clone is being dragged */}
					<MiniCard
						color="blue"
						top={hourOffset(10) + 2}
						height={HOUR_PX * 2 - 4}
						time="10:00"
						name="COMP1002 – Tutorial"
						location="Schulz, 214/218 | Adelaide City Campus East"
						className="animate-source-card"
					/>
					{/* Floating / dragged clone — moves from Tue → Mon */}
					<MiniCard
						color="blue"
						top={hourOffset(10) + 2}
						height={HOUR_PX * 2 - 4}
						time="10:00"
						name="COMP1002 – Tutorial"
						location="Schulz, 214/218 | Adelaide City Campus East"
						className="animate-drag-card pointer-events-none z-50"
						style={{ cursor: 'grabbing' }}
					/>
				</div>

				{/* Wed column — static ACCT purple card */}
				<div className="relative flex-1">
					{HOURS.slice(1).map((h) => (
						<div
							key={h}
							className="border-separator absolute w-full border-t"
							style={{ top: hourOffset(h) }}
						/>
					))}
					<MiniCard
						color="purple"
						top={hourOffset(11) + 2}
						height={HOUR_PX * 2 - 4}
						time="11:10"
						name="ACCT1000 - Seminar"
						location="Hughes, 111b | Adelaide City Campus East"
						style={{ opacity: 0.85 }}
					/>
					{/* Wed drop zone placeholder (another time option for COMP) */}
					<div
						className="animate-dropzone-wed border-apple-blue-500 absolute overflow-hidden rounded-2xl border border-dashed"
						style={{
							top: hourOffset(10) + 2,
							height: HOUR_PX * 2 - 4,
							left: 2,
							right: 2,
						}}
					>
						<div className="text-apple-blue-700 dark:text-apple-blue-500 absolute top-1/2 w-full -translate-y-1/2 px-2 text-left text-[9px] font-semibold">
							Schutz, 214/218 | Adelaide City Campus East
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
