import { Spinner } from "@workspace/ui/components/spinner"

export default function SpinnerSizes() {
	return (
		<div className="flex items-end gap-4">
			<Spinner size="xs" />
			<Spinner size="sm" />
			<Spinner size="md" />
			<Spinner size="lg" />
		</div>
	)
}
