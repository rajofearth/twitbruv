import { GithubPullCard } from "@workspace/ui/components/github-card"

export default function GithubPullCardExample() {
	return (
		<GithubPullCard
			url="https://github.com/vercel/next.js/pull/67890"
			owner="vercel"
			repo="next.js"
			number={67890}
			title="feat: add streaming support for Server Actions"
			state="merged"
			draft={false}
			authorLogin="leerob"
			headRef="feat/streaming-actions"
			baseRef="canary"
			additions={342}
			deletions={89}
			changedFiles={12}
			excerpt="This PR adds streaming support for Server Actions, allowing progressive rendering of action results."
		/>
	)
}
