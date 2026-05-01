import { Card } from "@workspace/ui/components/card"

export default function CardDefault() {
	return (
		<Card>
			<Card.Content>
				<p className="text-sm text-primary">
					A simple card with some content inside.
				</p>
			</Card.Content>
		</Card>
	)
}
