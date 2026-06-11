export const getAccessibleTextColor = (
	bgHex: string,
): '#000000' | '#FFFFFF' => {
	// Normalize hex string
	let hex = bgHex.replace(/^#/, '');
	if (hex.length === 3) {
		hex = hex
			.split('')
			.map((char) => char + char)
			.join('');
	}

	if (hex.length !== 6) {
		return '#000000'; // Fallback
	}

	const r = parseInt(hex.slice(0, 2), 16) / 255;
	const g = parseInt(hex.slice(2, 4), 16) / 255;
	const b = parseInt(hex.slice(4, 6), 16) / 255;

	// Calculate relative luminance
	const a = [r, g, b].map((v) => {
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});

	const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];

	// Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
	const contrastWithWhite = 1.05 / (luminance + 0.05);
	const contrastWithBlack = (luminance + 0.05) / 0.05;

	return contrastWithBlack > contrastWithWhite ? '#000000' : '#FFFFFF';
};

const LIGHT_BG_HEX = [
	'#C9E6FE', // BLUE
	'#EACDF4', // PURPLE
	'#D4F6C9', // GREEN
	'#FEDBC4', // ORANGE
	'#FDEEC3', // YELLOW
	'#FEBFD1', // RED
	'#DFD8CF', // BROWN
];

const DARK_BG_HEX = [
	'#19283B', // BLUE
	'#2F1E36', // PURPLE
	'#1D341F', // GREEN
	'#38271A', // ORANGE
	'#39341C', // YELLOW
	'#391A21', // RED
	'#292621', // BROWN
];

export const getAccessibleTextColorForCourse = (
	colorIndex: number,
	isDark: boolean,
): string => {
	const bgs = isDark ? DARK_BG_HEX : LIGHT_BG_HEX;
	const bg = bgs[colorIndex % bgs.length] || '#FFFFFF';
	return getAccessibleTextColor(bg);
};
