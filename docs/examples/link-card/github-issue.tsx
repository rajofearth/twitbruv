import { GithubIssueCard } from "@workspace/ui/components/github-card"

export default function GithubIssueCardExample() {
	return (
		<GithubIssueCard
			url="https://github.com/vercel/next.js/issues/12345"
			owner="vercel"
			repo="next.js"
			number={12345}
			title="Middleware rewrites fail silently when using edge runtime"
			state="open"
			authorLogin="timneutkens"
			comments={23}
			excerpt="When using middleware with edge runtime, rewrites to internal pages return a 200 but render an empty body. No error is logged."
			labels={[
				{ name: "bug", color: "d73a4a" },
				{ name: "Middleware", color: "0075ca" },
			]}
		/>
	)
}
