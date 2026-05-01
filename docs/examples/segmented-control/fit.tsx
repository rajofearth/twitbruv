import { useState } from "react"
import { SegmentedControl } from "@workspace/ui/components/segmented-control"

const options = [
	{ value: "daily", label: "Daily" },
	{ value: "weekly", label: "Weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "yearly", label: "Yearly" },
]

export default function SegmentedControlFit() {
	const [value, setValue] = useState("weekly")

	return (
		<SegmentedControl
			options={options}
			value={value}
			onValueChange={setValue}
			layout="fit"
		/>
	)
}
