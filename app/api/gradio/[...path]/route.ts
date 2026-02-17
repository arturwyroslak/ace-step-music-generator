import { NextRequest, NextResponse } from 'next/server'

const GRADIO_BASE = 'https://ace-step-ace-step-v1-5.hf.space/gradio_api'

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/gradio/', '')
  const body = await request.text()

  try {
    const response = await fetch(`${GRADIO_BASE}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/gradio/', '')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${GRADIO_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`

  try {
    const response = await fetch(url)
    
    // For streaming responses
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const stream = response.body
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // For regular responses
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    )
  }
}
