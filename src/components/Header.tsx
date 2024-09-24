import {
	Button,
	Link,
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	Tooltip,
} from '@nextui-org/react';

import { useHelpModal } from '../helpers/help-modal';

export const Header = () => {
	const openHelpModal = useHelpModal((s) => s.open);

	return (
		<Navbar isBordered maxWidth="xl" position="static">
			<NavbarBrand>
				<h1 className="font-bold text-inherit">My Timetable</h1>
			</NavbarBrand>
			<NavbarContent justify="end">
				<NavbarItem>
					<Tooltip content="Help" size="sm">
						<Button
							size="sm"
							isIconOnly
							variant="flat"
							color="primary"
							className="text-xl"
							onClick={openHelpModal}
						>
							❓
						</Button>
					</Tooltip>
				</NavbarItem>
				<NavbarItem>
					<Tooltip content="Report a bug" size="sm">
						<Button
							size="sm"
							isIconOnly
							variant="flat"
							color="primary"
							className="text-xl"
							as={Link}
							href="mailto:dev@csclub.org.au"
						>
							🐛
						</Button>
					</Tooltip>
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
};
