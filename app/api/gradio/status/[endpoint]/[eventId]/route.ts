import { NextRequest, NextResponse } from 'next/server'

const GRADIO_API_BASE = 'https://ace-step-ace-step-v1-5.hf.space/gradio_api'

export async function GET(
  request: NextRequest,
  { params }: { params: { endpoint: string; eventId: string } }
) {
  try {
    const { endpoint, eventId } = params

    const response = await fetch(
      `${GRADIO_API_BASE}/call/${endpoint}/${eventId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch status' },
        { status: response.status }
      )
    }

    const text = await response.text()

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Status proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
