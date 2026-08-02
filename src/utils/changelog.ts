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
		lower.includes('deps') ||
		lower.includes('dependency') ||
		lower.includes('dependencies') ||
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

export function parseRenovatePrBody(body: string): string[] {
	const lines = body.split(/\r?\n/);
	const changes: string[] = [];

	let inTable = false;
	let packageCol = -1;
	let changeCol = -1;
	let updateCol = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// Detect table header containing '|' and 'package'
		if (line.includes('|') && /\bpackage\b/i.test(line)) {
			const cells = line.split('|').map((c) => c.trim());
			const pCol = cells.findIndex((c) => /^package$/i.test(c));
			if (pCol !== -1) {
				packageCol = pCol;
				changeCol = cells.findIndex((c) => /^change$/i.test(c));
				updateCol = cells.findIndex((c) => /^update$/i.test(c));

				// Check if next line is a separator line (e.g. |---|---|...)
				if (i + 1 < lines.length && lines[i + 1].includes('---')) {
					inTable = true;
					i++; // Skip separator line
					continue;
				}
			}
		}

		if (inTable) {
			// Exit table if line doesn't contain '|' or is empty/separator
			if (!line.includes('|') || line.startsWith('---') || line === '') {
				inTable = false;
				continue;
			}

			const cells = line.split('|').map((c) => c.trim());
			if (cells.length <= packageCol) continue;

			const rawPackage = cells[packageCol];
			if (!rawPackage || rawPackage.startsWith('---')) continue;

			// Extract package name (e.g. "[actions/checkout](https://...)" -> "actions/checkout")
			const pkgMatch = rawPackage.match(/\[([^\]]+)\]/);
			const pkgName = pkgMatch
				? pkgMatch[1].trim()
				: rawPackage.replace(/[`*]/g, '').trim();

			if (!pkgName) continue;

			let changeStr = '';
			if (changeCol !== -1 && cells.length > changeCol && cells[changeCol]) {
				changeStr = cells[changeCol];
			}

			let updateStr = '';
			if (updateCol !== -1 && cells.length > updateCol && cells[updateCol]) {
				updateStr = cells[updateCol];
			}

			// Clean change string: strip markdown links inside change string e.g. [`5.0.0` -> `5.1.0`](https://...)
			const cleanChange = changeStr
				.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
				.trim();

			// Match version change patterns:
			// Pattern 1: `5.0.0` -> `5.1.0` or 5.0.0 -> 5.1.0 or v1 -> v2
			const fromToMatch = cleanChange.match(
				/`?([v\d\w.-]+)`?\s*(?:->|→)\s*`?([v\d\w.-]+)`?/,
			);
			// Pattern 2: -> `d23441a` or → `d23441a` or → d23441a
			const singleArrowMatch = cleanChange.match(/(?:->|→)\s*`?([v\d\w.-]+)`?/);

			let formattedChange = '';
			if (fromToMatch && fromToMatch[1] && fromToMatch[2]) {
				formattedChange = `from ${fromToMatch[1]} to ${fromToMatch[2]}`;
			} else if (singleArrowMatch && singleArrowMatch[1]) {
				formattedChange = `to ${singleArrowMatch[1]}`;
			} else {
				// Fallback sanitization
				const sanitized = cleanChange
					.replace(/[`→]/g, '')
					.replace(/->/g, 'to')
					.trim();
				if (sanitized) {
					formattedChange = sanitized.startsWith('to ')
						? sanitized
						: `to ${sanitized}`;
				} else if (updateStr) {
					formattedChange = `(${updateStr.replace(/[`]/g, '').trim()})`;
				}
			}

			if (formattedChange) {
				changes.push(`bump ${pkgName} ${formattedChange}`);
			} else {
				changes.push(`bump ${pkgName}`);
			}
		}
	}

	return changes;
}

export function parsePrBody(body: string, title?: string): string[] {
	const lines = body.split(/\r?\n/);
	const changes: string[] = [];
	let inChangesSection = false;

	for (const line of lines) {
		const trimmed = line.trim();

		// Check if we hit the "### Changes Made" header
		if (/^###\s+changes\s+made/i.test(trimmed)) {
			inChangesSection = true;
			continue;
		}

		// If we are in the section, parse any bullet points
		if (inChangesSection) {
			// If we hit any other header (e.g. ## or ###), we exit the section
			if (/^##+\s+/.test(trimmed) || /^###+\s+/.test(trimmed)) {
				break;
			}

			// Match bullet points: - item, * item, etc.
			const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
			if (bulletMatch) {
				changes.push(bulletMatch[1].trim());
			}
		}
	}

	if (changes.length === 0) {
		// Fallback for Renovate PRs
		const renovateChanges = parseRenovatePrBody(body);
		if (renovateChanges.length > 0) {
			return renovateChanges;
		}

		// Fallback for Renovate / Dependabot PRs using PR title if available
		const isRenovateOrDepsPr =
			body.includes('renovate') ||
			body.includes('renovate-debug') ||
			body.includes('dependabot') ||
			(title && isDependencyUpdate(title));

		if (isRenovateOrDepsPr && title && title.trim()) {
			return [title.trim()];
		}
	}

	return changes;
}
