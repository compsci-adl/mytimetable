import {
	Autocomplete,
	AutocompleteItem,
	Button,
	Select,
	SelectItem,
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { getCourses } from '../apis';
import { LocalStorageKey } from '../constants/local-storage-keys';
import { TERMS } from '../constants/terms';
import { YEAR } from '../constants/year';
import { useEnrolledCourses } from '../data/enrolled-courses';
import type { Key } from '../types/key';

export const SearchForm = () => {
	const enrolledCourses = useEnrolledCourses();

	const [selectedTerm, setSelectedTerm] = useState(
		localStorage.getItem(LocalStorageKey.Term) ?? 'sem1',
	);
	const changeTerm = (term: string) => {
		setSelectedTerm(term);
		localStorage.setItem(LocalStorageKey.Term, term);
	};
	const isTermSelectDisabled = enrolledCourses.courses.length > 0;

	const coursesQuery = useQuery({
		// TODO: Replace params with config data
		queryKey: ['courses', { year: YEAR, term: selectedTerm }] as const,
		queryFn: ({ queryKey }) => getCourses(queryKey[1]),
	});
	const courses = coursesQuery.data?.courses;
	const courseList =
		courses?.map((c) => ({
			id: c.id,
			name: `${c.name.subject} ${c.name.code} - ${c.name.title}`,
		})) ?? [];
	const [selectedCourseId, setSelectedCourseId] = useState<Key | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const course = courses?.find((c) => c.id === selectedCourseId);
		if (!course) return;
		enrolledCourses.addCourse({
			name: `${course.name.subject} ${course.name.code}`,
			id: course.id,
		});
		setSelectedCourseId(null);
	};

	return (
		<div className="flex gap-2 mobile:flex-col">
			<div
				onClick={() => {
					if (!isTermSelectDisabled) return;
					toast.warning('You need to drop all courses to change the term');
				}}
			>
				<Select
					label="Select a term"
					selectedKeys={[selectedTerm]}
					onSelectionChange={(keys) => changeTerm(keys.currentKey!)}
					className="w-72 mobile:w-full"
					isDisabled={isTermSelectDisabled}
					disallowEmptySelection
				>
					{TERMS.map((term) => (
						<SelectItem key={term.alias}>{term.name}</SelectItem>
					))}
				</Select>
			</div>
			<form
				className="flex grow items-center gap-2 mobile:flex-col"
				onSubmit={handleSubmit}
			>
				<Autocomplete
					label="Search a course"
					isDisabled={coursesQuery.isPending}
					defaultItems={courseList}
					selectedKey={selectedCourseId}
					onSelectionChange={setSelectedCourseId}
					disabledKeys={enrolledCourses.courses.map((c) => c.id)}
				>
					{(course) => (
						<AutocompleteItem key={course.id} value={course.id}>
							{course.name}
						</AutocompleteItem>
					)}
				</Autocomplete>
				<Button
					color="primary"
					type="submit"
					isDisabled={!selectedCourseId}
					className="mobile:w-full"
				>
					Add
				</Button>
			</form>
		</div>
	);
};
