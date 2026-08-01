/* eslint-disable no-console */
import { execFileSync, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function runGit(cmd: string): string {
	return execSync(cmd, { encoding: 'utf-8' }).trim();
}

function sanitiseMarkdown(text: string): string {
	return text
		.replace(/\r?\n|\r/g, ' ')
		.replace(/\0/g, '')
		.replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
		.trim();
}

function validateSafeFilePath(filePath: string) {
	const resolved = path.resolve(filePath);
	const baseName = path.basename(resolved);
	if (baseName !== 'CHANGELOG.md') {
		throw new Error(`Unsafe target file path: ${filePath}`);
	}
	const cwd = path.resolve(process.cwd());
	if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
		throw new Error(`File path must be inside repository root: ${filePath}`);
	}
}

function writeFileAtomic(
	filePath: string,
	contents: string,
	encoding: BufferEncoding,
) {
	validateSafeFilePath(filePath);
	const dir = path.dirname(filePath);
	const tempPath = path.join(dir, `.tmp-${process.pid}-${Date.now()}.tmp`);
	fs.writeFileSync(tempPath, contents, { encoding });
	fs.renameSync(tempPath, filePath);
}

interface Label {
	name: string;
}

// Semantic version bump rules
function bumpVersion(
	current: string,
	type: 'patch' | 'minor' | 'major',
): string {
	const parts = current.split('.').map(Number);
	if (parts.length !== 3 || parts.some(isNaN)) {
		throw new Error(`Invalid version format: ${current}`);
	}

	let [major, minor, patch] = parts;
	if (type === 'major') {
		major += 1;
		minor = 0;
		patch = 0;
	} else if (type === 'minor') {
		minor += 1;
		patch = 0;
	} else {
		patch += 1;
	}
	return `${major}.${minor}.${patch}`;
}

function isDependencyUpdate(subject: string): boolean {
	const lower = subject.toLowerCase();
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

function parseCommit(message: string): { type: string; description: string } {
	const firstLine = message.split(/\r?\n/)[0].trim();
	if (isDependencyUpdate(firstLine)) {
		return { type: 'deps', description: firstLine };
	}
	// Match semantic commit format: "type(scope): description" or "type: description" (allowing optional spaces)
	const match = firstLine.match(/^(\w+)(?:\([^)]+\))?\s*:\s*(.+)$/);
	if (match) {
		const type = match[1].toLowerCase();
		const description = match[2].trim();
		return { type, description };
	}
	return { type: 'chore', description: firstLine };
}

function formatDescription(desc: string, repo: string): string {
	let text = sanitiseMarkdown(desc);
	if (text.length === 0) return '';
	// Capitalise first letter
	text = text.charAt(0).toUpperCase() + text.slice(1);
	// Replace (#123) with ([#123](https://github.com/owner/repo/pull/123))
	text = text.replace(
		/\(#(\d+)\)/g,
		`([#$1](https://github.com/${repo}/pull/$1))`,
	);
	return text;
}

function parseSemver(v: string): number[] {
	const cleaned = v.replace(/^v/, '');
	const parts = cleaned.split('.').map(Number);
	return parts.some(isNaN) ? [0, 0, 0] : parts;
}

function compareVersions(v1: string, v2: string): number {
	const p1 = parseSemver(v1);
	const p2 = parseSemver(v2);
	for (let i = 0; i < 3; i++) {
		if (p1[i] !== p2[i]) {
			return p1[i] - p2[i];
		}
	}
	return 0;
}

function getChangelogVersions(content: string): string[] {
	const versions: string[] = [];
	const lines = content.split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		const match = trimmed.match(/^##\s+\[?([0-9]+\.[0-9]+\.[0-9]+)\]?/);
		if (match) {
			versions.push(match[1]);
		}
	}
	return versions;
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
				/`?([v\d\w\.\-]+)`?\s*(?:->|→)\s*`?([v\d\w\.\-]+)`?/,
			);
			// Pattern 2: -> `d23441a` or → `d23441a` or → d23441a
			const singleArrowMatch = cleanChange.match(
				/(?:->|→)\s*`?([v\d\w\.\-]+)`?/,
			);

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
				const itemText = bulletMatch[1].trim();
				if (itemText) {
					changes.push(itemText);
				}
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

async function main() {
	let prNumber = process.env.PR_NUMBER;
	const repo = process.env.GITHUB_REPOSITORY || 'compsci-adl/mytimetable';
	let prLabelsStr = process.env.PR_LABELS || '[]';
	let prBody = process.env.PR_BODY || '';
	let prTitle = process.env.PR_TITLE || '';
	let baseBranch = process.env.BASE_BRANCH || 'main';

	// Try to resolve context directly from the GitHub Actions event payload
	const eventPath = process.env.GITHUB_EVENT_PATH;
	if (eventPath && fs.existsSync(eventPath)) {
		try {
			const event = JSON.parse(fs.readFileSync(eventPath, 'utf-8'));
			const eventName = process.env.GITHUB_EVENT_NAME;

			if (eventName === 'push') {
				// Parse PR number from merge commit message
				const commitMsg = runGit('git log -n 1 --format="%B"');
				const match = commitMsg.match(/\(#[0-9]+\)/);
				if (match) {
					prNumber = match[0].replace(/[^0-9]/g, '');
					console.log(`Parsed PR #${prNumber} from merge commit message.`);

					// Fetch labels, body, title using GitHub CLI
					try {
						const prJson = execSync(
							`gh pr view ${prNumber} --json labels,body,title`,
							{
								encoding: 'utf-8',
								env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN },
							},
						);
						const prData = JSON.parse(prJson);
						prLabelsStr = JSON.stringify(prData.labels || []);
						prBody = prData.body || '';
						prTitle = prData.title || '';
						console.log(`Fetched details for PR #${prNumber} via GitHub CLI.`);
					} catch (cliError) {
						console.warn(`Could not fetch PR details via gh CLI:`, cliError);
					}
				}
			} else if (event.pull_request) {
				prNumber = String(event.pull_request.number);
				prLabelsStr = JSON.stringify(event.pull_request.labels || []);
				prBody = event.pull_request.body || '';
				prTitle = event.pull_request.title || '';
				baseBranch = event.pull_request.base?.ref || 'main';
				console.log(
					`Resolved PR #${prNumber} context directly from event webhook payload.`,
				);
			}
		} catch (err) {
			console.error('Failed to parse GITHUB_EVENT_PATH:', err);
		}
	}

	console.log(`PR Number: ${prNumber}`);
	console.log(`Repository: ${repo}`);
	console.log(`PR Labels JSON: ${prLabelsStr}`);

	// 1. Determine bump type
	let bumpType: 'patch' | 'minor' | 'major' | null = null;
	try {
		const labels = JSON.parse(prLabelsStr) as Label[];
		const labelNames = labels.map((l) => l.name);

		if (labelNames.includes('major-update')) {
			bumpType = 'major';
		} else if (labelNames.includes('minor-update')) {
			bumpType = 'minor';
		} else if (labelNames.includes('patch')) {
			bumpType = 'patch';
		}
	} catch (e) {
		console.error('Failed to parse PR labels JSON:', e);
	}

	if (!bumpType) {
		console.log(
			'No release labels (major-update, minor-update, patch) found in environment. Defaulting to patch.',
		);
		bumpType = 'patch';
	}

	console.log(`Determined bump type: ${bumpType}`);

	// 2. Group changes parsed completely from the PR description body's "Changes Made" section
	const added: string[] = [];
	const changed: string[] = [];
	const fixed: string[] = [];
	const removed: string[] = [];
	const packageUpdates: string[] = [];

	const prChanges = parsePrBody(prBody, prTitle);

	if (prChanges.length === 0) {
		console.error(
			'Error: No changes found under "### Changes Made" in the PR description.',
		);
		console.error(
			'To update the changelog, please add bullet points under a "### Changes Made" section in your PR description.',
		);
		process.exit(1);
	}

	console.log(`Parsed ${prChanges.length} changes from PR description.`);
	for (const change of prChanges) {
		let itemText = change;
		if (
			prNumber &&
			!itemText.includes(`(#${prNumber})`) &&
			!itemText.includes(`[#${prNumber}]`)
		) {
			itemText = `${itemText} (#${prNumber})`;
		}

		const parsed = parseCommit(change);
		const formattedDesc = formatDescription(itemText, repo);

		if (
			parsed.type === 'deps' ||
			parsed.type === 'build' ||
			parsed.type === 'ci'
		) {
			packageUpdates.push(formattedDesc);
		} else if (parsed.type === 'feat') {
			added.push(formattedDesc);
		} else if (parsed.type === 'fix') {
			fixed.push(formattedDesc);
		} else if (
			parsed.type === 'revert' ||
			parsed.type === 'remove' ||
			parsed.type === 'removed'
		) {
			removed.push(formattedDesc);
		} else {
			changed.push(formattedDesc);
		}
	}

	const pkgPath = path.join(process.cwd(), 'package.json');
	const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
	const pkg = JSON.parse(pkgContent);
	let oldVersion = pkg.version;
	if (baseBranch) {
		const isValidBaseBranch = /^[A-Za-z0-9._/-]+$/.test(baseBranch);
		if (!isValidBaseBranch) {
			console.warn(
				`Invalid BASE_BRANCH value "${baseBranch}", falling back to local package.json version.`,
			);
		} else {
			try {
				const basePkgContent = execFileSync(
					'git',
					['show', `origin/${baseBranch}:package.json`],
					{ encoding: 'utf-8' },
				);
				const basePkg = JSON.parse(basePkgContent);
				oldVersion = basePkg.version;
				console.log(
					`Retrieved base version from origin/${baseBranch}: ${oldVersion}`,
				);
			} catch (e) {
				console.warn(
					`Could not retrieve base version from origin/${baseBranch}, falling back to local package.json version.`,
					e,
				);
			}
		}
	}

	// Read CHANGELOG.md to ensure we don't regress version compared to existing entries
	const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
	let changelogContent = '';
	try {
		changelogContent = fs.readFileSync(changelogPath, 'utf-8');
		if (
			prNumber &&
			(changelogContent.includes(`/pull/${prNumber}`) ||
				changelogContent.includes(`(#${prNumber})`))
		) {
			console.log(
				`CHANGELOG.md already contains entries for PR #${prNumber}. Skipping version bump and changelog update.`,
			);
			process.exit(0);
		}
		let maxChangelogVersion = '0.0.0';
		const versions = getChangelogVersions(changelogContent);
		for (const v of versions) {
			if (compareVersions(v, maxChangelogVersion) > 0) {
				maxChangelogVersion = v;
			}
		}
		if (compareVersions(maxChangelogVersion, oldVersion) > 0) {
			console.log(
				`CHANGELOG.md has a higher version (${maxChangelogVersion}) than package.json (${oldVersion}). Using ${maxChangelogVersion} as base version.`,
			);
			oldVersion = maxChangelogVersion;
		}
	} catch (error) {
		const err = error as NodeJS.ErrnoException;
		if (err.code === 'ENOENT') {
			changelogContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n`;
		} else {
			throw err;
		}
	}

	const newVersion = bumpVersion(oldVersion, bumpType);

	// Write new version to package.json
	pkg.version = newVersion;
	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n', 'utf-8');

	// Clean up any existing entry for this version to prevent duplication when re-running in the PR
	let updatedContent = changelogContent;
	const versionHeader = `## [${newVersion}]`;
	const versionHeaderAlt = `## ${newVersion}`;
	let headerIndex = updatedContent.indexOf(versionHeader);
	if (headerIndex === -1) {
		headerIndex = updatedContent.indexOf(versionHeaderAlt);
	}
	if (headerIndex !== -1) {
		console.log(
			`Changelog already contains an entry for version ${newVersion}. Replacing it...`,
		);
		const nextHeaderIndex = updatedContent.indexOf('\n## ', headerIndex + 5);
		if (nextHeaderIndex !== -1) {
			updatedContent =
				updatedContent.substring(0, headerIndex) +
				updatedContent.substring(nextHeaderIndex + 1);
		} else {
			updatedContent = updatedContent.substring(0, headerIndex);
		}
	}
	changelogContent = updatedContent;

	const today = new Date().toISOString().split('T')[0];
	let newEntry = `\n## [${newVersion}] - ${today}\n`;

	if (added.length > 0) {
		newEntry += `\n### Added\n\n`;
		added.forEach((item) => {
			newEntry += `- ${item}\n`;
		});
	}
	if (changed.length > 0) {
		newEntry += `\n### Changed\n\n`;
		changed.forEach((item) => {
			newEntry += `- ${item}\n`;
		});
	}
	if (fixed.length > 0) {
		newEntry += `\n### Fixed\n\n`;
		fixed.forEach((item) => {
			newEntry += `- ${item}\n`;
		});
	}
	if (removed.length > 0) {
		newEntry += `\n### Removed\n\n`;
		removed.forEach((item) => {
			newEntry += `- ${item}\n`;
		});
	}
	if (packageUpdates.length > 0) {
		newEntry += `\n### Package Updates\n\n`;
		packageUpdates.forEach((item) => {
			newEntry += `- ${item}\n`;
		});
	}

	// Insert the new entry after the introductory header of the changelog
	const headerMarker =
		'and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).';
	const markerIndex = changelogContent.indexOf(headerMarker);

	if (markerIndex !== -1) {
		const insertPos = markerIndex + headerMarker.length;
		const updatedChangelog =
			changelogContent.substring(0, insertPos) +
			'\n' +
			newEntry +
			changelogContent.substring(insertPos);
		writeFileAtomic(changelogPath, updatedChangelog, 'utf-8');
	} else {
		// Fallback to prepending
		writeFileAtomic(changelogPath, changelogContent + '\n' + newEntry, 'utf-8');
	}

	console.log(
		`Successfully updated CHANGELOG.md with entry for version ${newVersion}`,
	);
}

if (process.env.VITEST !== 'true') {
	main().catch((err) => {
		console.error('Fatal error in update-changelog-ci:', err);
		process.exit(1);
	});
}
