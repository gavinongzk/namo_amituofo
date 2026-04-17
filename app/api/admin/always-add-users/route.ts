import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/database';
import AutoEnrollProfile from '@/lib/database/models/autoEnrollProfile.model';

const getRoleFromClaims = (sessionClaims: any): string | undefined => {
  return (sessionClaims?.role as string) || (sessionClaims?.metadata?.role as string);
};

const normalizePhoneNumber = (value: string) => value.trim();

let didEnsureIndexes = false;
const ensureAlwaysAddUsersIndexes = async () => {
  if (didEnsureIndexes) return;

  const collection = AutoEnrollProfile.collection;
  const indexes = await collection.indexes();
  const legacyUniqueIndex = indexes.find(
    (index) =>
      index.name === 'phoneNumber_1_country_1' &&
      index.unique === true
  );

  // Drop old unique index so duplicate phone numbers are allowed.
  if (legacyUniqueIndex) {
    await collection.dropIndex('phoneNumber_1_country_1');
  }

  // Ensure the non-unique query index exists.
  await collection.createIndex({ phoneNumber: 1, country: 1 }, { unique: false });
  didEnsureIndexes = true;
};

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims } = auth();
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || role !== 'superadmin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    await ensureAlwaysAddUsersIndexes();

    const country = req.nextUrl.searchParams.get('country');
    const query = country ? { country } : {};

    const profiles = await AutoEnrollProfile.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ data: profiles });
  } catch (error) {
    console.error('Failed to fetch always-add users:', error);
    return NextResponse.json({ message: 'Failed to fetch always-add users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = auth();
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || role !== 'superadmin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const name = String(body?.name || '').trim();
    const phoneNumber = normalizePhoneNumber(String(body?.phoneNumber || ''));
    const postalCode = String(body?.postalCode || '').trim();
    const country = String(body?.country || '').trim();
    const enabled = body?.enabled !== false;

    if (!name || !phoneNumber || !country) {
      return NextResponse.json(
        { message: 'name, phoneNumber, and country are required' },
        { status: 400 }
      );
    }

    if (country !== 'Singapore' && country !== 'Malaysia') {
      return NextResponse.json({ message: 'country must be Singapore or Malaysia' }, { status: 400 });
    }

    await connectToDatabase();
    await ensureAlwaysAddUsersIndexes();

    const profile = await AutoEnrollProfile.create({
      name,
      phoneNumber,
      postalCode,
      country,
      enabled,
      createdBy: userId,
    });

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create always-add user:', error);
    return NextResponse.json({ message: 'Failed to create always-add user' }, { status: 500 });
  }
}
