import { Badge } from "@workspace/ui/components/badge"

export default function BadgeCustomColor() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge color="#d73a4a">bug</Badge>
			<Badge color="#0075ca">Middleware</Badge>
			<Badge color="#a2eeef">enhancement</Badge>
			<Badge color="#7057ff">good first issue</Badge>
			<Badge color="#e4e669">documentation</Badge>
		</div>
	)
}
