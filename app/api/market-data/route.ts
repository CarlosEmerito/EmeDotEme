import { NextResponse } from 'next/server';
import { getMarketData } from '@/modules/market/market.service';

export async function GET() {
  try {
    const data = await getMarketData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
