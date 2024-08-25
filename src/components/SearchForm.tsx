import { Autocomplete, AutocompleteItem, Button } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import { getCourses } from '../apis';
import { useEnrolledCourses } from '../data/enrolled-courses';
import type { Key } from '../types/key';

export const SearchForm = () => {
	const coursesQuery = useQuery({
		// TODO: Replace params with config data
		queryKey: ['courses', { year: 2024, term: 'sem2' }] as const,
		queryFn: ({ queryKey }) => getCourses(queryKey[1]),
	});
	const courses = coursesQuery.data?.courses;
	const courseList =
		courses?.map((c) => ({
			id: c.id,
			name: `${c.name.subject} ${c.name.code} - ${c.name.title}`,
		})) ?? [];
	const [selectedCourseId, setSelectedCourseId] = useState<Key | null>(null);

	const enrolledCourses = useEnrolledCourses();
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
		<form className="flex items-center gap-2" onSubmit={handleSubmit}>
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
			<Button color="primary" type="submit" isDisabled={!selectedCourseId}>
				Add
			</Button>
		</form>
	);
};
