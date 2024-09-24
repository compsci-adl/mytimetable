// Thanks to @Char2sGu for the help with types
type CourseColor<Primary extends string> = {
	border: `border-[#${Primary}]`;
	bg: `bg-[#${string}]`;
	text: `text-[#${string}]`;
	dot: `bg-[#${NoInfer<Primary>}]`;
};

/**
 * Enforces dot color to be the same as border color
 * @param color
 * @returns
 */
const color = <Primary extends string>(color: CourseColor<Primary>) => {
	return color;
};

const BLUE = color({
	border: 'border-[#1D9BF6]',
	bg: 'bg-[#C9E6FE]',
	text: 'text-[#1D6AA1]',
	dot: 'bg-[#1D9BF6]',
});
const PURPLE = color({
	border: 'border-[#AF38D1]',
	bg: 'bg-[#EACDF4]',
	text: 'text-[#762C8B]',
	dot: 'bg-[#AF38D1]',
});
const GREEN = color({
	border: 'border-[#4AD321]',
	bg: 'bg-[#D4F6C9]',
	text: 'text-[#3E8522]',
	dot: 'bg-[#4AD321]',
});
const ORANGE = color({
	border: 'border-[#FA6D0D]',
	bg: 'bg-[#FEDBC4]',
	text: 'text-[#A75117]',
	dot: 'bg-[#FA6D0D]',
});
const YELLOW = color({
	border: 'border-[#FCB80F]',
	bg: 'bg-[#FDEEC3]',
	text: 'text-[#936E10]',
	dot: 'bg-[#FCB80F]',
});
const BROWN = color({
	border: 'border-[#7D5E3B]',
	bg: 'bg-[#DFD8CF]',
	text: 'text-[#5E4D39]',
	dot: 'bg-[#7D5E3B]',
});
const RED = color({
	border: 'border-[#F50445]',
	bg: 'bg-[#FEBFD1]',
	text: 'text-[#BB1644]',
	dot: 'bg-[#F50445]',
});
const BLACK = color({
	border: 'border-[#000000]',
	bg: 'bg-[#D3D3D3]',
	text: 'text-[#000000]',
	dot: 'bg-[#000000]',
});

export const COURSE_COLORS = [BLUE, PURPLE, GREEN, ORANGE, YELLOW, RED, BROWN];

export const NOT_FOUND_COLOR = BLACK;
