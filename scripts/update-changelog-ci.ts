/* eslint-disable no-console */
import { execFileSync, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function runGit(cmd: string): string {
	try {
		return execSync(cmd, { encoding: 'utf-8' }).trim();
	} catch (error) {
		console.error(`Error running git command: ${cmd}`, error);
		process.exit(1);
	}
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

function validateRepo(repo: string): string {
	// Expected format: owner/repo, GitHub-safe characters only
	if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
		throw new Error(`Invalid repository format: ${repo}`);
	}
	return repo;
}

function validatePrNumber(prNumber: string): string {
	// PR number must be a positive integer
	if (!/^[1-9][0-9]*$/.test(prNumber)) {
		throw new Error(`Invalid PR number: ${prNumber}`);
	}
	return prNumber;
}

async function getPRCommits(
	repo: string,
	prNumber: string,
	token: string,
): Promise<string[]> {
	const safeRepo = validateRepo(repo);
	const safePrNumber = validatePrNumber(prNumber);
	const [owner, repoName] = safeRepo.split('/');
	const url = new URL(
		`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
			repoName,
		)}/pulls/${encodeURIComponent(safePrNumber)}/commits`,
		'https://api.github.com',
	).toString();
	console.log(`Fetching PR commits from: ${url}`);
	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `token ${token}`,
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': 'github-actions-changelog-updater',
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch commits: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as Array<{
			commit: { message: string };
		}>;
		return data.map((c) => c.commit.message);
	} catch (error) {
		console.error('Error fetching commits from GitHub API:', error);
		// Fallback to git log
		console.log('Falling back to git log for commits...');
		const log = runGit('git log -n 20 --format="%s"');
		return log.split(/\r?\n/).filter(Boolean);
	}
}

function isDependencyUpdate(subject: string): boolean {
	const lower = subject.toLowerCase();
	return (
		lower.includes('dependabot') ||
		lower.includes('renovate') ||
		lower.startsWith('bump ') ||
		lower.includes('npm_and_yarn') ||
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

async function main() {
	const token = process.env.GITHUB_TOKEN;
	const prNumber = process.env.PR_NUMBER;
	const repo = process.env.GITHUB_REPOSITORY || 'compsci-adl/mytimetable';
	const prLabelsStr = process.env.PR_LABELS || '[]';

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

	// 2. Fetch commits
	let commitMessages: string[] = [];
	if (repo && prNumber && token) {
		commitMessages = await getPRCommits(repo, prNumber, token);
	} else {
		console.log(
			'Missing GITHUB_TOKEN, PR_NUMBER, or GITHUB_REPOSITORY. Running in local fallback mode...',
		);
		const log = runGit('git log -n 10 --format="%s"');
		commitMessages = log.split(/\r?\n/).filter(Boolean);
	}

	console.log(`Retrieved ${commitMessages.length} commits.`);

	// 3. Group messages
	const added: string[] = [];
	const changed: string[] = [];
	const fixed: string[] = [];
	const removed: string[] = [];
	const packageUpdates: string[] = [];

	for (const msg of commitMessages) {
		const { type, description } = parseCommit(msg);

		// Format commit description with a reference to the PR if available
		let itemText = description;
		if (
			prNumber &&
			!itemText.includes(`(#${prNumber})`) &&
			!itemText.includes(`[#${prNumber}]`)
		) {
			itemText = `${itemText} (#${prNumber})`;
		}

		const formattedDesc = formatDescription(itemText, repo);

		if (type === 'deps') {
			packageUpdates.push(formattedDesc);
		} else if (type === 'feat') {
			added.push(formattedDesc);
		} else if (type === 'fix') {
			fixed.push(formattedDesc);
		} else if (type === 'revert') {
			removed.push(formattedDesc);
		} else {
			changed.push(formattedDesc);
		}
	}

	// If no commits parsed, add a generic description
	if (
		added.length === 0 &&
		changed.length === 0 &&
		fixed.length === 0 &&
		removed.length === 0 &&
		packageUpdates.length === 0
	) {
		const fallbackDesc = process.env.PR_TITLE || 'Version update';
		let itemText = fallbackDesc;
		if (
			prNumber &&
			!itemText.includes(`(#${prNumber})`) &&
			!itemText.includes(`[#${prNumber}]`)
		) {
			itemText = `${itemText} (#${prNumber})`;
		}
		changed.push(formatDescription(itemText, repo));
	}

	// 4. Update package.json version
	const pkgPath = path.join(process.cwd(), 'package.json');
	const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
	const pkg = JSON.parse(pkgContent);
	let oldVersion = pkg.version;
	const baseBranch = process.env.BASE_BRANCH;
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

	const newVersion = bumpVersion(oldVersion, bumpType);

	// 5. Update CHANGELOG.md
	const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
	let changelogContent = '';
	try {
		changelogContent = fs.readFileSync(changelogPath, 'utf-8');
	} catch (error) {
		const err = error as NodeJS.ErrnoException;
		if (err.code === 'ENOENT') {
			changelogContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n`;
		} else {
			throw err;
		}
	}

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

main().catch((err) => {
	console.error('Fatal error in update-changelog-ci:', err);
	process.exit(1);
});
