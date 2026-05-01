import { Card } from "@workspace/ui/components/card"

export default function CardWithHeader() {
	return (
		<Card>
			<Card.Header>
				<span className="text-sm font-medium text-primary">Settings</span>
			</Card.Header>
			<Card.Body>
				<p className="text-sm text-secondary">
					Configure your account preferences and notification settings.
				</p>
			</Card.Body>
			<Card.Section>
				<p className="text-sm text-tertiary">
					Last updated 2 hours ago.
				</p>
			</Card.Section>
		</Card>
	)
}
