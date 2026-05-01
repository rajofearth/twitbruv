import { GithubCommitCard } from "@workspace/ui/components/github-card"

export default function GithubCommitCardExample() {
	return (
		<GithubCommitCard
			url="https://github.com/vercel/next.js/commit/abc1234"
			owner="vercel"
			repo="next.js"
			shortSha="abc1234"
			messageHeadline="fix: resolve hydration mismatch in App Router"
			messageBody="The client and server were rendering different timestamps due to timezone handling in Date.toLocaleDateString()."
			authorLogin="timneutkens"
			additions={8}
			deletions={3}
			changedFiles={2}
		/>
	)
}
