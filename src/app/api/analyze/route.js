import { NextResponse } from 'next/server';
import { analyzeFootprint } from '@/lib/gemini';

export async function POST(request) {
  try {
    const body = await request.json();
    const { answers } = body;

    if (!answers) {
      return NextResponse.json(
        { error: 'Missing answers in request body' },
        { status: 400 }
      );
    }

    const analysis = await analyzeFootprint(answers);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error in analyze API route:', error);
    return NextResponse.json(
      { error: 'Failed to process AI analysis', details: error.message },
      { status: 500 }
    );
  }
}
