import { useState } from "react"
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/16/solid"
import { SegmentedControl } from "@workspace/ui/components/segmented-control"

const options = [
	{ value: "light", icon: <SunIcon /> },
	{ value: "dark", icon: <MoonIcon /> },
	{ value: "system", icon: <ComputerDesktopIcon /> },
]

export default function SegmentedControlIcons() {
	const [value, setValue] = useState("system")

	return (
		<SegmentedControl
			options={options}
			value={value}
			onValueChange={setValue}
		/>
	)
}
