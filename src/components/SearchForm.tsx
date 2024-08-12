import { Autocomplete, AutocompleteItem, Button } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import { getCourses } from '../apis';

type Key = string | number;

export const SearchForm = () => {
	const coursesQuery = useQuery({
		// TODO: Replace params with config data
		queryKey: ['courses', { year: 2024, term: 'sem2' }] as const,
		queryFn: ({ queryKey }) => getCourses(queryKey[1]),
	});
	const [selectedCourseId, setSelectedCourseId] = useState<Key | null>(null);
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log(selectedCourseId);
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
