import { create } from 'zustand';

import { LocalStorageKey } from '../constants/local-storage-keys';
import { useMount } from '../utils/mount';

type HelpModalState = {
	isOpen: boolean;
	close: () => void;
	open: () => void;
};
export const useHelpModal = create<HelpModalState>()((set) => ({
	isOpen: false,
	close: () => set({ isOpen: false }),
	open: () => set({ isOpen: true }),
}));

export const useFirstTimeHelp = () => {
	const helpModal = useHelpModal();
	useMount(() => {
		const isFirstTime =
			localStorage.getItem(LocalStorageKey.FirstTime) === null;
		if (!isFirstTime) return;
		localStorage.setItem(LocalStorageKey.FirstTime, 'false');
		helpModal.open();
	});
};
