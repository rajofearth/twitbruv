import { Badge } from "@workspace/ui/components/badge"

export default function BadgeVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge variant="neutral">Neutral</Badge>
			<Badge variant="success">Success</Badge>
			<Badge variant="warning">Warning</Badge>
			<Badge variant="danger">Danger</Badge>
			<Badge variant="merged">Merged</Badge>
		</div>
	)
}
