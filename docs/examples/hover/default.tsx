import { Hover } from "@workspace/ui/components/hover"

export default function HoverDefault() {
	return (
		<div className="flex items-center gap-2">
			<Hover borderRadius="rounded-lg">
				<button type="button" className="px-4 py-2 text-sm text-primary">
					Hover me
				</button>
			</Hover>
			<Hover borderRadius="rounded-lg" active>
				<button type="button" className="px-4 py-2 text-sm text-primary">
					Active
				</button>
			</Hover>
		</div>
	)
}
