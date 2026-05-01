import { useState } from "react"
import { SegmentedControl } from "@workspace/ui/components/segmented-control"

const options = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "archived", label: "Archived" },
]

export default function SegmentedControlDefault() {
	const [value, setValue] = useState("all")

	return (
		<SegmentedControl
			options={options}
			value={value}
			onValueChange={setValue}
		/>
	)
}
