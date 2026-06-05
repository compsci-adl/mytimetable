import React from 'react';

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

const COLORS = {
	blue: {
		bg: '#C9E6FE',
		border: '#1D9BF6',
		text: '#1D6AA1',
	},
	purple: {
		bg: '#E8DAFF',
		border: '#8B5CF6',
		text: '#5B21B6',
	},
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
	const c = COLORS[color];
	return (
		<div
			className={`absolute overflow-hidden rounded-md p-1 ${className}`}
			style={{
				top,
				height,
				left: 2,
				right: 2,
				backgroundColor: c.bg,
				borderLeft: `3px solid ${c.border}`,
				color: c.text,
				...style,
			}}
		>
			<div className="text-[10px]">{time}</div>
			<div className="pr-5 text-[11px] leading-tight font-bold">{name}</div>
			<div className="pr-5 text-[10px] leading-tight opacity-80">
				{location}
			</div>
			<div className="absolute right-1 bottom-1 text-[13px] font-bold">+</div>
		</div>
	);
};

export const MiniTimetableDemo = () => {
	// offset in px from top of the time-body for a given hour
	const hourOffset = (h: number) => (h - START_HOUR) * HOUR_PX;

	return (
		<div
			className="border-divider bg-content1/40 w-full overflow-hidden rounded-xl border shadow-inner select-none"
			style={{ fontFamily: 'Outfit Variable, sans-serif' }}
		>
			{/* Header row */}
			<div className="border-divider flex border-b" style={{ height: 28 }}>
				{/* corner */}
				<div
					className="border-divider shrink-0 border-r"
					style={{ width: 36 }}
				/>
				{['Mon 2', 'Tue 3', 'Wed 4'].map((day) => (
					<div
						key={day}
						className="border-divider text-default-500 flex flex-1 items-center justify-center border-r text-[11px] font-semibold"
					>
						{day}
					</div>
				))}
			</div>

			{/* Body: time labels + columns */}
			<div className="flex" style={{ height: HOUR_PX * (HOURS.length - 1) }}>
				{/* Time labels */}
				<div
					className="border-divider relative shrink-0 border-r"
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
				<div className="border-divider relative flex-1 border-r">
					{/* horizontal hour lines */}
					{HOURS.slice(1).map((h) => (
						<div
							key={h}
							className="border-divider absolute w-full border-t"
							style={{ top: hourOffset(h) }}
						/>
					))}
					{/* Animated drop-zone placeholder (Mon, 10:00–12:00) */}
					<div
						className="animate-dropzone-mon absolute overflow-hidden rounded-md border border-dashed"
						style={{
							top: hourOffset(10) + 2,
							height: HOUR_PX * 2 - 4,
							left: 2,
							right: 2,
						}}
					>
						<div
							className="absolute top-1/2 w-full -translate-y-1/2 text-center text-[9px] font-semibold"
							style={{ color: '#1D6AA1' }}
						>
							Schutz, 214/218 | Adelaide City Campus East
						</div>
					</div>
				</div>

				{/* Tue column — source card (fades when dragging) */}
				<div className="border-divider relative flex-1 border-r">
					{HOURS.slice(1).map((h) => (
						<div
							key={h}
							className="border-divider absolute w-full border-t"
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
							className="border-divider absolute w-full border-t"
							style={{ top: hourOffset(h) }}
						/>
					))}
					<MiniCard
						color="purple"
						top={hourOffset(11) + 2}
						height={HOUR_PX * 2 - 4}
						time="11:10"
						name="ACCT1001 – Seminar"
						location="Helen Mayo South, S336 | Adelaide City Campus East"
						style={{ opacity: 0.85 }}
					/>
					{/* Wed drop zone placeholder (another time option for COMP) */}
					<div
						className="animate-dropzone-wed absolute overflow-hidden rounded-md border border-dashed"
						style={{
							top: hourOffset(10) + 2,
							height: HOUR_PX * 2 - 4,
							left: 2,
							right: 2,
						}}
					>
						<div
							className="absolute top-1/2 w-full -translate-y-1/2 text-center text-[9px] font-semibold"
							style={{ color: '#1D6AA1' }}
						>
							Schutz, 214/218 | Adelaide City Campus East
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
