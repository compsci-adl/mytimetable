import { Autocomplete, AutocompleteItem, Button } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

import { getCourse, getCourses } from '../apis';
import { useCourses } from '../store/courses';

// https://github.com/nextui-org/nextui/issues/2182
type Key = string | number;

export const SearchForm = () => {
	const coursesQuery = useQuery({
		// TODO: Replace params with config data
		queryKey: ['courses', { year: 2024, term: 'sem2' }] as const,
		queryFn: ({ queryKey }) => getCourses(queryKey[1]),
	});
	const [selectedCourseId, setSelectedCourseId] = useState<Key | null>(null);
	const courseQuery = useQuery({
		queryKey: ['course', { id: (selectedCourseId as string) ?? '' }] as const,
		queryFn: ({ queryKey }) => getCourse(queryKey[1]),
		enabled: false,
	});

	const coursesState = useCourses();

	useEffect(() => {
		if (!courseQuery.isSuccess) return;
		const course = courseQuery.data.data;
		coursesState.addCourse({
			name: `${course.name.subject} ${course.name.code}`,
			id: course.id,
			classes: course.class_list.map((c) => ({
				id: c.id,
				classNumber: c.classes[0].number,
			})),
		});
	}, [courseQuery.data, courseQuery.isSuccess]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		await courseQuery.refetch();
		setSelectedCourseId(null);
	};

	return (
		<form className="flex items-center gap-2" onSubmit={handleSubmit}>
			<Autocomplete
				label="Search a course"
				isDisabled={coursesQuery.isPending}
				defaultItems={coursesQuery.data?.data.courses ?? []}
				selectedKey={selectedCourseId}
				onSelectionChange={setSelectedCourseId}
				disabledKeys={coursesState.courses.map((c) => c.id)}
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
				isLoading={courseQuery.isFetching}
			>
				Add
			</Button>
		</form>
	);
};
