import { useState } from "react"
import { Hover, HoverGroup } from "@workspace/ui/components/hover"

const tabs = ["Home", "Search", "Notifications", "Profile"]

export default function HoverGrouped() {
	const [active, setActive] = useState("Home")

	return (
		<HoverGroup borderRadius="rounded-lg">
			{tabs.map((tab) => (
				<Hover
					key={tab}
					borderRadius="rounded-lg"
					active={tab === active}
				>
					<button
						type="button"
						onClick={() => setActive(tab)}
						className="px-4 py-2 text-sm text-primary"
					>
						{tab}
					</button>
				</Hover>
			))}
		</HoverGroup>
	)
}
