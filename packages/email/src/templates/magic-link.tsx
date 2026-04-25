import { Button, Heading, Section, Text } from '@react-email/components'
import { Layout } from './layout.tsx'

export function MagicLinkEmail({
  url,
  appName = 'twotter',
}: {
  url: string
  appName?: string
}) {
  return (
    <Layout preview={`Sign in to ${appName}`} appName={appName}>
      <Section>
        <Heading as="h1" style={{ fontSize: 22 }}>
          Your sign-in link
        </Heading>
        <Text>Click to sign in. This link expires in 15 minutes and can be used once.</Text>
        <Button
          href={url}
          style={{
            backgroundColor: '#111',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 8,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Sign in
        </Button>
      </Section>
    </Layout>
  )
}
