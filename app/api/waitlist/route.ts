import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured')
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 500 }
    )
  }

  const resend = new Resend(apiKey)
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    // Add to Resend Audience (waitlist)
    if (audienceId) {
      await resend.contacts.create({
        email,
        audienceId: audienceId,
      })
    }

    // Send welcome email to subscriber
    await resend.emails.send({
      from: 'RunTag <onboarding@resend.dev>',
      to: email,
      subject: "You're on the RunTag waitlist!",
      html: `
        <div style="font-family: monospace; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-family: sans-serif; font-size: 32px; margin-bottom: 20px;">
            You're in.
          </h1>
          <p style="color: #666; line-height: 1.6;">
            Thanks for joining the RunTag waitlist. We'll let you know when your starter kit is ready.
          </p>
          <p style="color: #666; line-height: 1.6; margin-top: 20px;">
            In the meantime, remember: the only metric that matters is showing up.
          </p>
          <p style="margin-top: 40px; color: #34c759; font-weight: bold;">
            Don't break the chain.
          </p>
          <p style="margin-top: 40px; color: #999; font-size: 12px;">
            — RunTag
          </p>
        </div>
      `,
    })

    // Notify team of new signup
    await resend.emails.send({
      from: 'RunTag Waitlist <onboarding@resend.dev>',
      to: 'runtag@floutlabs.com',
      subject: `New waitlist signup: ${email}`,
      html: `
        <div style="font-family: monospace; padding: 20px;">
          <h2>New RunTag Waitlist Signup</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    )
  }
}
