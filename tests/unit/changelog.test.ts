import {
	parseChangelog,
	isDependencyUpdate,
	isValidChangelogUrl,
} from '../../src/utils/changelog';

describe('isDependencyUpdate', () => {
	it('should return true for dependabot and renovate strings', () => {
		expect(isDependencyUpdate('bump @babel/core from 7.0.0 to 7.1.0')).toBe(
			true,
		);
		expect(
			isDependencyUpdate('chore(deps): bump vite from 5.4.14 to 5.4.21 (#51)'),
		).toBe(true);
		expect(
			isDependencyUpdate(
				'Merge pull request #12 from dependabot/npm_and_yarn/foo',
			),
		).toBe(true);
		expect(isDependencyUpdate('Update renovate config')).toBe(true);
		expect(
			isDependencyUpdate('bump the npm_and_yarn group across 1 directory'),
		).toBe(true);
	});

	it('should return false for regular changes', () => {
		expect(isDependencyUpdate('Add welcome screen (#94)')).toBe(false);
		expect(isDependencyUpdate('Correctly filter classes by term')).toBe(false);
		expect(isDependencyUpdate('Fix a bug in calendar zoom')).toBe(false);
	});
});

describe('parseChangelog', () => {
	it('should parse valid keep a changelog structure', () => {
		const markdown = `# Changelog
		
## [1.1.0] - 2026-06-11

### Added
- Add a new amazing feature (#2)
- Another cool addition

### Fixed
- Fix calendar crashing on Sunday

## [1.0.0] - 2026-06-01

### Added
- Initial release
`;

		const result = parseChangelog(markdown);
		expect(result).toHaveLength(2);

		expect(result[0].version).toBe('1.1.0');
		expect(result[0].date).toBe('2026-06-11');
		expect(result[0].subsections).toHaveLength(2);
		expect(result[0].subsections[0].title).toBe('Added');
		expect(result[0].subsections[0].items).toEqual([
			{ text: 'Add a new amazing feature (#2)', indent: 0 },
			{ text: 'Another cool addition', indent: 0 },
		]);
		expect(result[0].subsections[1].title).toBe('Fixed');
		expect(result[0].subsections[1].items).toEqual([
			{ text: 'Fix calendar crashing on Sunday', indent: 0 },
		]);

		expect(result[1].version).toBe('1.0.0');
		expect(result[1].date).toBe('2026-06-01');
		expect(result[1].subsections).toHaveLength(1);
		expect(result[1].subsections[0].title).toBe('Added');
		expect(result[1].subsections[0].items).toEqual([
			{ text: 'Initial release', indent: 0 },
		]);
	});

	it('should exclude dependabot/renovate entries', () => {
		const markdown = `# Changelog
		
## [1.2.0] - 2026-06-12

### Added
- Add welcome screen

### Changed
- bump vite from 5.0.0 to 5.1.0
- Refactor the button styles
- bump picomatch from 2.3.1 to 2.3.2 in the npm_and_yarn group
`;

		const result = parseChangelog(markdown);
		expect(result).toHaveLength(1);
		expect(result[0].version).toBe('1.2.0');
		expect(result[0].subsections).toHaveLength(2);

		expect(result[0].subsections[0].title).toBe('Added');
		expect(result[0].subsections[0].items).toEqual([
			{ text: 'Add welcome screen', indent: 0 },
		]);

		expect(result[0].subsections[1].title).toBe('Changed');
		expect(result[0].subsections[1].items).toEqual([
			{ text: 'Refactor the button styles', indent: 0 },
		]); // Bumps excluded!
	});

	it('should exclude versions that only contain dependency bumps', () => {
		const markdown = `# Changelog
		
## [1.3.0] - 2026-06-13

### Changed
- bump vite from 5.0.0 to 5.1.0

## [1.2.0] - 2026-06-12

### Added
- Actual changes
`;

		const result = parseChangelog(markdown);
		expect(result).toHaveLength(1);
		expect(result[0].version).toBe('1.2.0');
	});

	it('should exclude the Package Updates subsection completely', () => {
		const markdown = `# Changelog
		
## [1.4.0] - 2026-06-14

### Added
- Actual feature addition

### Package Updates
- bump flatted from 3.3.3 to 3.4.1 (#83)
`;

		const result = parseChangelog(markdown);
		expect(result).toHaveLength(1);
		expect(result[0].version).toBe('1.4.0');
		expect(result[0].subsections).toHaveLength(1);
		expect(result[0].subsections[0].title).toBe('Added');
		expect(result[0].subsections[0].items).toEqual([
			{ text: 'Actual feature addition', indent: 0 },
		]);
	});

	it('should parse indentation levels for nested items', () => {
		const markdown = `# Changelog
		
## [1.5.0] - 2026-06-15

### Added
- Main change item
  - First nested point
    - Double nested point
`;

		const result = parseChangelog(markdown);
		expect(result).toHaveLength(1);
		expect(result[0].subsections[0].items).toEqual([
			{ text: 'Main change item', indent: 0 },
			{ text: 'First nested point', indent: 1 },
			{ text: 'Double nested point', indent: 2 },
		]);
	});

	it('should exclude test: and tests: prefixed commits with various spacing', () => {
		const markdown = `# Changelog
		
## [1.6.0] - 2026-06-16

### Added
- Real feature implementation

### Changed
- Test: Add unit and e2e test (#93)
- Tests: Add integration check
- test:something
- test : something
- tests  : something else
- Refactor helper module
`;

		const result = parseChangelog(markdown);
		expect(result).toHaveLength(1);
		expect(result[0].version).toBe('1.6.0');
		expect(result[0].subsections).toHaveLength(2);
		expect(result[0].subsections[0].title).toBe('Added');
		expect(result[0].subsections[0].items).toEqual([
			{ text: 'Real feature implementation', indent: 0 },
		]);
		expect(result[0].subsections[1].title).toBe('Changed');
		expect(result[0].subsections[1].items).toEqual([
			{ text: 'Refactor helper module', indent: 0 },
		]); // test/tests commits excluded!
	});

	it('should support asterisk bullet points and varying spacing', () => {
		const markdown = `# Changelog
		
## [1.7.0]
### Added
* Feature A
  * Sub-feature A1
`;
		const result = parseChangelog(markdown);
		expect(result).toHaveLength(1);
		expect(result[0].version).toBe('1.7.0');
		expect(result[0].date).toBeNull();
		expect(result[0].subsections[0].items).toEqual([
			{ text: 'Feature A', indent: 0 },
			{ text: 'Sub-feature A1', indent: 1 },
		]);
	});

	it('should ignore non-bullet lines and empty lines in subsections', () => {
		const markdown = `# Changelog
		
## [1.8.0] - 2026-06-18
### Added
Some random description text that is not a bullet point.

- Actual feature point
`;
		const result = parseChangelog(markdown);
		expect(result).toHaveLength(1);
		expect(result[0].subsections[0].items).toEqual([
			{ text: 'Actual feature point', indent: 0 },
		]);
	});

	it('should handle version headers without brackets', () => {
		const markdown = `# Changelog
		
## 1.9.0 - 2026-06-19
### Added
- Feature without brackets
`;
		const result = parseChangelog(markdown);
		expect(result).toHaveLength(1);
		expect(result[0].version).toBe('1.9.0');
		expect(result[0].date).toBe('2026-06-19');
	});
});

describe('isValidChangelogUrl', () => {
	it('should allow safe absolute URLs with http/https schemes', () => {
		expect(
			isValidChangelogUrl('https://github.com/compsci-adl/mytimetable'),
		).toBe(true);
		expect(isValidChangelogUrl('http://localhost:3000')).toBe(true);
		expect(isValidChangelogUrl('https://keepachangelog.com/en/1.1.0/')).toBe(
			true,
		);
	});

	it('should allow relative paths', () => {
		expect(isValidChangelogUrl('/pull/123')).toBe(true);
		expect(isValidChangelogUrl('./docs/readme.md')).toBe(true);
		expect(isValidChangelogUrl('../README.md')).toBe(true);
	});

	it('should reject dangerous protocols like javascript, data, vbscript, and file', () => {
		expect(isValidChangelogUrl('javascript:alert(1)')).toBe(false);
		expect(isValidChangelogUrl('javascript:alert(document.cookie)')).toBe(
			false,
		);
		expect(
			isValidChangelogUrl('data:text/html,<script>alert(1)</script>'),
		).toBe(false);
		expect(isValidChangelogUrl('vbscript:msgbox("hello")')).toBe(false);
		expect(isValidChangelogUrl('file:///etc/passwd')).toBe(false);
	});

	it('should detect and reject obfuscated javascript: URLs with spaces, tabs, or newlines', () => {
		expect(isValidChangelogUrl(' java\nscript:alert(1) ')).toBe(false);
		expect(isValidChangelogUrl('java\tscript:alert(1)')).toBe(false);
		expect(isValidChangelogUrl('javascript\x00:alert(1)')).toBe(false);
	});

	it('should filter out specific control/non-printable characters', () => {
		// \x7f (127) and \x82 (130) are filtered out, \xaa (170) is kept
		expect(isValidChangelogUrl('java\x7fscript:alert(1)')).toBe(false);
		expect(isValidChangelogUrl('java\x82script:alert(1)')).toBe(false);
		expect(isValidChangelogUrl('https://example.com/foo\xaa')).toBe(true);
	});

	it('should reject protocol relative URLs for safety', () => {
		expect(isValidChangelogUrl('//evil.com')).toBe(false);
	});
});
