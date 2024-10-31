export const prefetchImages = (imagePaths: string[]) => {
	imagePaths.forEach((path) => {
		const img = new Image();
		img.src = path;
	});
};
