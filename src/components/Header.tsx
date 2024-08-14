import {
	Button,
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
} from '@nextui-org/react';

export const Header = () => {
	return (
		<Navbar isBordered maxWidth="xl">
			<NavbarBrand>
				<h1 className="font-bold text-inherit">My Timetable</h1>
			</NavbarBrand>
			<NavbarContent justify="end">
				<NavbarItem>
					<Button
						color="primary"
						variant="flat"
						isIconOnly
						href="https://csclub.org.au"
						as="a"
					>
						🦆
					</Button>
				</NavbarItem>
				<NavbarItem>
					<Button color="primary" variant="flat" isIconOnly>
						⚙️
					</Button>
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
};
