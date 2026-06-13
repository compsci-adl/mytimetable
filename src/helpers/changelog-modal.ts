import { create } from 'zustand';

type ChangelogModalState = {
	isOpen: boolean;
	close: () => void;
	open: () => void;
};

export const useChangelogModal = create<ChangelogModalState>()((set) => ({
	isOpen: false,
	close: () => set({ isOpen: false }),
	open: () => set({ isOpen: true }),
}));
