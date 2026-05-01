import { Button } from "@workspace/ui/components/button"
import { PlusIcon, ArrowRightIcon } from "@heroicons/react/16/solid"

export default function ButtonIcons() {
	return (
		<div className="flex items-center gap-2">
			<Button variant="primary" iconLeft={<PlusIcon />}>
				Create
			</Button>
			<Button variant="outline" iconRight={<ArrowRightIcon />}>
				Continue
			</Button>
			<Button variant="secondary" iconLeft={<PlusIcon />} />
		</div>
	)
}
