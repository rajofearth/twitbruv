import {
	Cog6ToothIcon,
	UserIcon,
	ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/16/solid"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu } from "@workspace/ui/components/dropdown-menu"

export default function DropdownMenuWithGroups() {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button variant="outline">Options</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.Label>Account</DropdownMenu.Label>
					<DropdownMenu.Item icon={<UserIcon />}>Profile</DropdownMenu.Item>
					<DropdownMenu.Item icon={<Cog6ToothIcon />}>Settings</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item icon={<ArrowRightStartOnRectangleIcon />}>
					Log out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	)
}
