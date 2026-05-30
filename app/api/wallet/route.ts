import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { address, signature, message } = await req.json();

    if (!address || !signature || !message) {
      return NextResponse.json({ error: 'Address, signature, and message are required' }, { status: 400 });
    }

    // Proxy request to the Express backend server
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
    const response = await fetch(`${backendUrl}/api/v1/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, signature, message }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to save wallet to backend' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Wallet saved successfully', data }, { status: 200 });
  } catch (error) {
    console.error('Failed to save wallet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
