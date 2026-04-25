import { Button, Heading, Section, Text } from '@react-email/components'
import { Layout } from './layout.tsx'

export function ResetEmail({
  url,
  name,
  appName = 'twotter',
}: {
  url: string
  name: string
  appName?: string
}) {
  return (
    <Layout preview={`Reset your ${appName} password`} appName={appName}>
      <Section>
        <Heading as="h1" style={{ fontSize: 22 }}>
          Reset your password
        </Heading>
        <Text>Hi {name || 'there'},</Text>
        <Text>Click the button below to set a new password. This link expires in one hour.</Text>
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
          Reset password
        </Button>
        <Text style={{ marginTop: 20, fontSize: 12, color: '#666' }}>Or open: {url}</Text>
      </Section>
    </Layout>
  )
}
