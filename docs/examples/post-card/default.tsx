import { PostCard } from "@workspace/ui/components/post-card"

export default function PostCardDefault() {
	return (
		<PostCard
			author={{
				handle: "aaronmahlke",
				displayName: "Aaron Mahlke",
				avatarUrl: "/avatars/aaronmahlke.png",
			}}
			text="just shipped the new component library. pure neutral, very rounded, zero decoration. feels right."
			time="2m"
			likes={24}
			replies={3}
			reposts={2}
		/>
	)
}
