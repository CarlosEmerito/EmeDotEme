import { NextResponse, NextRequest } from 'next/server';
import { getMarketData, getHistoricalData } from '@/modules/market/market.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coinId');
  const days = searchParams.get('days') || '7';

  try {
    if (coinId) {
      const data = await getHistoricalData(coinId, days);
      return NextResponse.json(data);
    }
    
    const data = await getMarketData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}

