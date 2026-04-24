import { Heading, Section, Text } from '@react-email/components'
import { Layout } from './layout.tsx'

export function WelcomeEmail({ handle }: { handle: string }) {
  return (
    <Layout preview="Welcome to twotter">
      <Section>
        <Heading as="h1" style={{ fontSize: 22 }}>
          Welcome, @{handle}
        </Heading>
        <Text>
          You're all set. twotter is open source, free for everyone, and built without AI. There
          are no paywalls, no black-box rankers, and no ads.
        </Text>
        <Text>Pin repos to your profile, write articles, and say hello — the feed is yours.</Text>
      </Section>
    </Layout>
  )
}
