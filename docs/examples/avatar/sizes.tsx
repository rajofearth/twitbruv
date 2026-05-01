import { Avatar } from "@workspace/ui/components/avatar"

export default function AvatarSizes() {
	return (
		<div className="flex items-center gap-3">
			<Avatar initial="A" size="xs" />
			<Avatar initial="A" size="sm" />
			<Avatar initial="A" size="md" />
			<Avatar initial="A" size="lg" />
			<Avatar initial="A" size="xl" />
		</div>
	)
}
