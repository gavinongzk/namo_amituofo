import { connectToDatabase } from '@/lib/database';
import Event from '@/lib/database/models/event.model';

export default async function TestPage() {
  try {
    await connectToDatabase();

    const eventCount = await Event.countDocuments();

    const testQuery = {
      $and: [
        { country: 'Singapore' },
        { isDeleted: { $ne: true } },
        { isDraft: { $ne: true } },
        { endDateTime: { $gte: new Date() } }
      ]
    };

    const events = await Event.find(testQuery).limit(5);

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>
        <div className="space-y-4">
          <p><strong>Database Status:</strong> Connected ✅</p>
          <p><strong>Total Events:</strong> {eventCount}</p>
          <p><strong>Active Events:</strong> {events.length}</p>
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Sample Events:</h2>
            {events.map((event: any) => (
              <div key={event._id} className="border p-2 mb-2 rounded">
                <p><strong>Title:</strong> {event.title}</p>
                <p><strong>Country:</strong> {event.country}</p>
                <p><strong>Start Date:</strong> {event.startDateTime?.toDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ Error in test page:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Database Test Page - ERROR</h1>
        <div className="space-y-4">
          <p><strong>Error:</strong> {error instanceof Error ? error.message : 'Unknown error'}</p>
          <pre className="bg-grey-100 p-4 rounded overflow-auto">
            {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
}
