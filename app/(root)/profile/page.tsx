export const dynamic = "force-dynamic";
import Collection from '@/components/shared/Collection'
import { Button } from '@/components/ui/button'
import { getEventsByUser } from '@/lib/actions/event.actions'
import { currentUser } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'

const ProfilePage = async ({ searchParams }: { searchParams: any }) => {
  try {
    const user = await currentUser();
    
    if (!user || !user.publicMetadata) {
      return <div>User not authenticated or missing metadata</div>;
    }

    const userId = user.publicMetadata.userId as string;
    const eventsPage = Number(searchParams?.eventsPage) || 1;
    const organizedEventsData = await getEventsByUser({ userId, page: eventsPage }) || { data: [], totalPages: 0 };
    const currentDate = new Date();
    const upcomingEvents = organizedEventsData.data.filter(event => new Date(event.endDateTime) >= currentDate);

    return (
      <div className="flex flex-col gap-10">
        {/* Events Organized Section */}
        <section className="bg-secondary-50">
          <div className="wrapper py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className='h2-bold text-secondary-500'>Events Organized 我组织的活动</h2>
              <Button asChild size="lg" className="button hidden sm:flex">
                <Link href="/events/create">
                  Create New Event
                </Link>
              </Button>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <Collection 
                data={upcomingEvents}
                emptyTitle="No events have been created yet"
                emptyStateSubtext="Go create some now"
                collectionType="Events_Organized"
                limit={3}
                page={eventsPage}
                urlParamName="eventsPage"
                totalPages={organizedEventsData.totalPages}
                userId={userId}
              />
            </div>
          </div>
        </section>
      </div>
    )
  } catch (error) {
    console.error('Error in ProfilePage:', error);
    return <div>Something went wrong. Please try again later.</div>;
  }
}

export default ProfilePage