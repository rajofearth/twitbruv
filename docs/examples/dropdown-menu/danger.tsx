import { PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu } from "@workspace/ui/components/dropdown-menu"

export default function DropdownMenuDanger() {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button variant="outline">Actions</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Item icon={<PencilIcon />}>Edit</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item icon={<TrashIcon />} variant="danger">
					Delete
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	)
}
