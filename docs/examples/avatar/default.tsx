import { Avatar } from "@workspace/ui/components/avatar"

export default function AvatarDefault() {
	return (
		<div className="flex items-center gap-3">
			<Avatar initial="A" src="/avatars/aaronmahlke.png" />
			<Avatar initial="a" src="/avatars/bruvimtired.jpg" />
			<Avatar initial="V" src="/avatars/vc.jpg" />
			<Avatar initial="D" />
		</div>
	)
}
