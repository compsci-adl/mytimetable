export interface ChangelogItem {
	text: string;
	indent: number;
}

export interface ChangelogSubsection {
	title: string;
	items: ChangelogItem[];
}

export interface ChangelogSection {
	version: string;
	date: string | null;
	subsections: ChangelogSubsection[];
}

/**
 * Checks if a changelog item is an automated dependabot or renovate update patch.
 */
export function isDependencyUpdate(itemText: string): boolean {
	const lower = itemText.toLowerCase();
	return (
		lower.includes('dependabot') ||
		lower.includes('renovate') ||
		lower.startsWith('bump ') ||
		lower.includes('npm_and_yarn') ||
		/bump\s+[\w\-@/]+/i.test(lower)
	);
}

/**
 * Parses raw CHANGELOG.md markdown text into a structured array of version sections.
 * Excludes dependabot/renovate update patches.
 */
export function parseChangelog(markdown: string): ChangelogSection[] {
	const sections: ChangelogSection[] = [];
	const lines = markdown.split(/\r?\n/);
	let currentSection: ChangelogSection | null = null;
	let currentSubsection: ChangelogSubsection | null = null;

	for (const line of lines) {
		const trimmed = line.trim();

		// Match version header: e.g., "## [1.0.0] - 2026-06-11", "## [Unreleased]" or bracketless "## 1.0.0 - 2026-06-11"
		const versionMatch = trimmed.match(
			/^##\s+(?:\[([^\]]+)\]|([a-zA-Z0-9.-]+))(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/,
		);
		if (versionMatch) {
			currentSection = {
				version: versionMatch[1] || versionMatch[2],
				date: versionMatch[3] || null,
				subsections: [],
			};
			sections.push(currentSection);
			currentSubsection = null;
			continue;
		}

		// Match subsection header: e.g., "### Added", "### Fixed"
		const subsectionMatch = trimmed.match(/^###\s+(.+)$/);
		if (subsectionMatch && currentSection) {
			const subTitle = subsectionMatch[1].trim();
			if (subTitle.toLowerCase() === 'package updates') {
				currentSubsection = null;
				continue;
			}
			currentSubsection = {
				title: subTitle,
				items: [],
			};
			currentSection.subsections.push(currentSubsection);
			continue;
		}

		// Match bullet points: e.g., "  - drag-and-drop calendar interface"
		const matchBullet = line.match(/^(\s*)([-*])\s+(.+)$/);
		if (matchBullet) {
			if (currentSubsection) {
				const indentSpaces = matchBullet[1].length;
				const itemText = matchBullet[3].trim();
				const isTestCommit = /^tests?\s*:/i.test(itemText);

				if (itemText && !isDependencyUpdate(itemText) && !isTestCommit) {
					// We calculate indentation level based on number of leading spaces (usually 2 spaces per level)
					const indent = Math.floor(indentSpaces / 2);
					currentSubsection.items.push({
						text: itemText,
						indent,
					});
				}
			}
		}
	}

	// Filter out empty subsections and sections that contain no changes after filtering
	return sections
		.map((section) => {
			const activeSubsections = section.subsections.filter(
				(sub) => sub.items.length > 0,
			);
			return {
				...section,
				subsections: activeSubsections,
			};
		})
		.filter(
			(section) =>
				section.subsections.length > 0 || section.version === 'Unreleased',
		);
}

/**
 * Safely validates links found in changelog items to prevent XSS (e.g. javascript: URLs).
 */
export function isValidChangelogUrl(urlStr: string): boolean {
	const trimmed = urlStr.trim();
	// Remove control characters, newlines, tabs, and spaces inside the protocol to prevent bypasses like `java\nscript:`
	let sanitized = '';
	for (let i = 0; i < trimmed.length; i++) {
		const code = trimmed.charCodeAt(i);
		if (code > 32 && code !== 127 && (code < 128 || code > 159)) {
			sanitized += trimmed[i];
		}
	}

	// Block javascript:, data:, vbscript:, file: protocols
	if (/^(javascript|data|vbscript|file):/i.test(sanitized)) {
		return false;
	}

	// Allow relative paths starting with / (excluding protocol-relative //)
	if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
		return true;
	}

	try {
		const parsed = new URL(trimmed);
		return parsed.protocol === 'https:' || parsed.protocol === 'http:';
	} catch {
		// If URL parsing fails, we only allow it if it does not contain a scheme colon
		// and does not start with protocol-relative //
		return !trimmed.includes(':') && !trimmed.startsWith('//');
	}
}
