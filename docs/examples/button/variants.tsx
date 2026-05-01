import { Button } from "@workspace/ui/components/button"

export default function ButtonVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button variant="primary">Primary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="transparent">Transparent</Button>
			<Button variant="danger">Danger</Button>
			<Button variant="danger-light">Danger Light</Button>
		</div>
	)
}
