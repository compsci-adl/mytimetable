import { create } from 'zustand';
import { mutative } from 'zustand-mutative';

import { LocalStorageKey } from '../constants/local-storage-keys';

type Term = {
	term: string;
};

type TermActions = {
	set: (term: string) => void;
};

export const useSelectedTerm = create<Term & TermActions>()(
	mutative((set) => ({
		term: localStorage.getItem(LocalStorageKey.Term) ?? 'sem1',
		set: (term: string) =>
			set((state) => {
				state.term = term;
			}),
	})),
);
