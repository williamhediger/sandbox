import { NextResponse } from 'next/server';
import { loadAndQuery } from '@/lib/langchain';
import { QueryRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { query } = (await request.json()) as QueryRequest;
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    const answer = await loadAndQuery(query);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}