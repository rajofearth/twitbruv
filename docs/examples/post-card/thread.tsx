import { PostCard } from "@workspace/ui/components/post-card"

export default function PostCardThread() {
	return (
		<div>
			<PostCard
				author={{
					handle: "bruvimtired",
					displayName: "ahmet",
					avatarUrl: "/avatars/bruvimtired.jpg",
				}}
				text="been thinking about why so many teams abandon their design systems after 6 months..."
				time="5h"
				likes={67}
				replies={12}
				reposts={5}
				threadLine="bottom"
			/>
			<PostCard
				author={{
					handle: "madewithmiso",
					displayName: "V.C. Billingsley",
					avatarUrl: "/avatars/vc.jpg",
				}}
				text="hot take: most design systems fail because they optimize for the component author, not the component user."
				time="4h"
				likes={412}
				replies={34}
				reposts={89}
				liked
				threadLine="top"
			/>
		</div>
	)
}
