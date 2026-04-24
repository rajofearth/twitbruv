import { Button, Heading, Section, Text } from '@react-email/components'
import { Layout } from './layout.tsx'

export function VerifyEmail({ url, name }: { url: string; name: string }) {
  return (
    <Layout preview="Verify your twotter email">
      <Section>
        <Heading as="h1" style={{ fontSize: 22 }}>
          Confirm your email
        </Heading>
        <Text>Hi {name || 'there'},</Text>
        <Text>Click the button below to confirm your email address and finish setting up your account.</Text>
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
          Verify email
        </Button>
        <Text style={{ marginTop: 20, fontSize: 12, color: '#666' }}>Or open this link: {url}</Text>
      </Section>
    </Layout>
  )
}
