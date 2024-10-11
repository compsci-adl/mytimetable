import { Modal, ModalBody, ModalContent, ModalHeader } from '@nextui-org/react';

interface FooterModalProps {
	title: string;
	content: string;
	isOpen: boolean;
	onClose: () => void;
}

const FooterModal: React.FC<FooterModalProps> = ({
	title,
	content,
	isOpen,
	onClose,
}) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent>
				<ModalHeader>{title}</ModalHeader>
				<ModalBody>
					<p className="mb-4">{content}</p>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

export default FooterModal;
