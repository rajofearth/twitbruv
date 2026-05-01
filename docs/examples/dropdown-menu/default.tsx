import { EllipsisVerticalIcon } from "@heroicons/react/16/solid"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu } from "@workspace/ui/components/dropdown-menu"

export default function DropdownMenuDefault() {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button variant="outline" iconLeft={<EllipsisVerticalIcon />} />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Item>Edit</DropdownMenu.Item>
				<DropdownMenu.Item>Duplicate</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>Archive</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	)
}
