export const Footer = () => {
	return (
		<footer className="text-center text-sm text-apple-gray-500">
			<a
				href="https://github.com/compsci-adl/mytimetable"
				className="underline"
			>
				GitHub Repo
			</a>
			<span className="mx-1">&copy; {new Date().getFullYear()}</span>
			<a href="https://csclub.org.au/" className="underline">
				The University of Adelaide Computer Science Club
			</a>
		</footer>
	);
};
