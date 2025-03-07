import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Event Details';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Simplified version that works in Edge Runtime
export default async function Image({ params }: { params: { id: string } }) {
  try {
    // Fetch event data from an API route instead of direct DB access
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/events/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event');
    }

    const event = await response.json();

    if (!event) {
      return new ImageResponse(
        (
          <div
            style={{
              background: 'linear-gradient(to bottom, #000000, #1a1a1a)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'sans-serif',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: 48,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Event Not Found
            </div>
          </div>
        ),
        {
          ...size,
        }
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom, #000000, #1a1a1a)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            padding: '40px',
          }}
        >
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              style={{
                width: '300px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '16px',
                marginBottom: '40px',
                border: '4px solid rgba(255,255,255,0.1)',
              }}
            />
          )}
          <div
            style={{
              color: 'white',
              fontSize: 60,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '20px',
              lineHeight: 1.2,
            }}
          >
            {event.title}
          </div>
          <div
            style={{
              color: '#9ca3af',
              fontSize: 32,
              textAlign: 'center',
            }}
          >
            {new Date(event.startDateTime).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom, #000000, #1a1a1a)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 48,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Error Loading Event
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }
} 