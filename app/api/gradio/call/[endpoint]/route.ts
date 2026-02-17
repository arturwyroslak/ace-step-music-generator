import { NextRequest, NextResponse } from 'next/server'

const GRADIO_API_BASE = 'https://ace-step-ace-step-v1-5.hf.space/gradio_api'

export async function POST(
  request: NextRequest,
  { params }: { params: { endpoint: string } }
) {
  try {
    const { endpoint } = params
    const body = await request.json()

    const response = await fetch(`${GRADIO_API_BASE}/call/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to call Gradio API' },
      { status: 500 }
    )
  }
}
