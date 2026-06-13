# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-06-13

### Added

- Add welcome screen ([#94](https://github.com/compsci-adl/mytimetable/pull/94)) ([#100](https://github.com/compsci-adl/mytimetable/pull/100))
- Design Update ([#96](https://github.com/compsci-adl/mytimetable/pull/96)) ([#100](https://github.com/compsci-adl/mytimetable/pull/100))
- Quality of life changes ([#98](https://github.com/compsci-adl/mytimetable/pull/98)) ([#100](https://github.com/compsci-adl/mytimetable/pull/100))
- Update help steps and add new images for improved user guidance ([#99](https://github.com/compsci-adl/mytimetable/pull/99)) ([#100](https://github.com/compsci-adl/mytimetable/pull/100))

### Changed

- Add test for clearing all enrolled courses in Zustand store ([#100](https://github.com/compsci-adl/mytimetable/pull/100))

### Fixed

- Apply security suggestions from code review ([#100](https://github.com/compsci-adl/mytimetable/pull/100))
- Update workflow to use pnpm for Node.js setup ([#100](https://github.com/compsci-adl/mytimetable/pull/100))

### Package Updates

- Feat: Add changelog, switch to Renovate and improve layout ([#97](https://github.com/compsci-adl/mytimetable/pull/97)) ([#100](https://github.com/compsci-adl/mytimetable/pull/100))

## [2.4.0] - 2026-06-04

### Added

- Add auto-timetable ([#92](https://github.com/compsci-adl/mytimetable/pull/92))

### Changed

- Add unit and e2e test ([#93](https://github.com/compsci-adl/mytimetable/pull/93))

## [2.3.0] - 2026-06-02

### Fixed

- Correctly filter classes by term for class selection ([#91](https://github.com/compsci-adl/mytimetable/pull/91))

## [2.2.0] - 2026-05-09

### Added

- Add assessment and learning outcomes info ([#80](https://github.com/compsci-adl/mytimetable/pull/80))

### Package Updates

- Chore(deps): bump @babel/plugin-transform-modules-systemjs from 7.29.0 to 7.29.4 in the npm_and_yarn group across 1 directory ([#90](https://github.com/compsci-adl/mytimetable/pull/90))
- Chore(deps): bump fast-uri from 3.1.0 to 3.1.2 in the npm_and_yarn group across 1 directory ([#89](https://github.com/compsci-adl/mytimetable/pull/89))
- Chore(ci): Add workflow to auto-approve dependabot PRs ([#88](https://github.com/compsci-adl/mytimetable/pull/88))
- Chore(deps): bump picomatch from 2.3.1 to 2.3.2 in the npm_and_yarn group across 1 directory ([#86](https://github.com/compsci-adl/mytimetable/pull/86))
- Chore(deps): bump flatted from 3.4.1 to 3.4.2 in the npm_and_yarn group across 1 directory ([#84](https://github.com/compsci-adl/mytimetable/pull/84))
- Chore(deps): bump flatted from 3.3.3 to 3.4.1 in the npm_and_yarn group across 1 directory ([#83](https://github.com/compsci-adl/mytimetable/pull/83))
- Chore(deps): bump the npm_and_yarn group across 1 directory with 2 updates ([#82](https://github.com/compsci-adl/mytimetable/pull/82))
- Chore(deps): bump the npm_and_yarn group across 1 directory with 2 updates ([#81](https://github.com/compsci-adl/mytimetable/pull/81))

## [2.1.0] - 2026-02-09

### Added

- Add search filters and more course info ([#76](https://github.com/compsci-adl/mytimetable/pull/76))

### Changed

- Increase course limit from 7 to 10 ([#78](https://github.com/compsci-adl/mytimetable/pull/78))

### Package Updates

- Chore(deps): bump @isaacs/brace-expansion from 5.0.0 to 5.0.1 in the npm_and_yarn group across 1 directory ([#77](https://github.com/compsci-adl/mytimetable/pull/77))

## [2.0.0] - 2026-01-27

### Added

- Add calendar file export ([#61](https://github.com/compsci-adl/mytimetable/pull/61))
- Show course conflicts ([#60](https://github.com/compsci-adl/mytimetable/pull/60))
- Add class modal and support availability and section ([#59](https://github.com/compsci-adl/mytimetable/pull/59))
- Changed to support Adelaide University 2026 courses by integrating v2 of the Courses API ([#52](https://github.com/compsci-adl/mytimetable/pull/52))

### Changed

- Improve security and update packages ([#72](https://github.com/compsci-adl/mytimetable/pull/72))
- Change contrast on dark mode for class conflicts message ([#64](https://github.com/compsci-adl/mytimetable/pull/64)) ([#69](https://github.com/compsci-adl/mytimetable/pull/69))
- Add definition check for umami ([#68](https://github.com/compsci-adl/mytimetable/pull/68))
- Update privacy disclaimer text ([#62](https://github.com/compsci-adl/mytimetable/pull/62))

### Fixed

- Prefer classes from same term ([#71](https://github.com/compsci-adl/mytimetable/pull/71))
- Run unit tests workflow properly ([#58](https://github.com/compsci-adl/mytimetable/pull/58))
- Fix type and linting issues ([#57](https://github.com/compsci-adl/mytimetable/pull/57))

### Package Updates

- Chore(deps-dev): bump lodash from 4.17.21 to 4.17.23 in the npm_and_yarn group across 1 directory ([#74](https://github.com/compsci-adl/mytimetable/pull/74))
- Chore(deps-dev): bump lodash-es from 4.17.22 to 4.17.23 in the npm_and_yarn group across 1 directory ([#73](https://github.com/compsci-adl/mytimetable/pull/73))

## [1.13.3] - 2025-10-21

### Package Updates

- Chore(deps-dev): bump vite from 5.4.14 to 5.4.21 ([#51](https://github.com/compsci-adl/mytimetable/pull/51))

## [1.13.2] - 2025-08-18

### Fixed

- Update CourseCard key generation ([#47](https://github.com/compsci-adl/mytimetable/pull/47))

## [1.13.1] - 2025-02-20

### Fixed

- Remove unused value prop from AutocompleteItem in SearchForm ([#46](https://github.com/compsci-adl/mytimetable/pull/46))

## [1.13.0] - 2025-02-20

### Changed

- Update packages and migrate from NextUI to HeroUI ([#45](https://github.com/compsci-adl/mytimetable/pull/45))

## [1.12.0] - 2025-01-02

### Added

- Add TikTok and YouTube Links ([#42](https://github.com/compsci-adl/mytimetable/pull/42))

## [1.11.0] - 2024-12-08

### Added

- SEO Optimise site description ([#33](https://github.com/compsci-adl/mytimetable/pull/33))

## [1.10.0] - 2024-12-08

### Added

- I18n for enrolment instruction ([#37](https://github.com/compsci-adl/mytimetable/pull/37))

## [1.9.0] - 2024-12-08

### Added

- Track course subject and name when adding course ([#35](https://github.com/compsci-adl/mytimetable/pull/35))

## [1.8.0] - 2024-12-08

### Added

- Add ready and copy text buttons ([#34](https://github.com/compsci-adl/mytimetable/pull/34))

## [1.7.0] - 2024-12-04

### Added

- Compress help images ([#32](https://github.com/compsci-adl/mytimetable/pull/32))

## [1.6.0] - 2024-11-27

### Added

- Add tips ([#29](https://github.com/compsci-adl/mytimetable/pull/29))

## [1.5.0] - 2024-10-31

### Changed

- Fix lint and format check for workflow ([#23](https://github.com/compsci-adl/mytimetable/pull/23))

## [1.4.0] - 2024-10-31

### Added

- Prefetch images in help modal for smoother image display ([#22](https://github.com/compsci-adl/mytimetable/pull/22))

## [1.3.0] - 2024-10-22

### Added

- Search by course abbreviation ([commit](https://github.com/compsci-adl/mytimetable/commit/e0cd4fc1b580ab1bd0b3bc588d0ee10287050109))

## [1.2.0] - 2024-10-15

### Changed

- Add linting and formatting checks workflow ([#18](https://github.com/compsci-adl/mytimetable/pull/18))

## [1.1.0] - 2024-10-14

### Added

- Improve footer ui ([#17](https://github.com/compsci-adl/mytimetable/pull/17))

## [1.0.0] - 2024-10-09

### Added

- Official Release of MyTimetable ([commit](https://github.com/compsci-adl/mytimetable/commit/9fd6bc3baa5aacd7055d24b3bcf1fcbb51d0c322)). Includes:
  - Lighter dark mode theme, style improvements, and PWA setup.

## [0.1.0] - 2024-10-08

### Added

- Initial Minimum Viable Product (MVP) release of MyTimetable ([commit](https://github.com/compsci-adl/mytimetable/commit/563c28d6ddf6283cac1cb2ce924ad9035539063b)). Includes:
  - Drag-and-drop calendar interface.
  - Subject and course search.
  - Zoom controls and mobile scaling.
  - Multi-language support (English and Chinese).
  - Dark mode and standard styling themes.
