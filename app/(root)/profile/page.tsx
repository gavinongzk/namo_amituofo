import Collection from '@/components/shared/Collection'
import { Button } from '@/components/ui/button'
import { getEventsByUser } from '@/lib/actions/event.actions'
import { getRegistrationsByUser } from '@/lib/actions/registration.actions'
import { auth, currentUser } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'
import RegistrationLookup from '@/components/shared/RegistrationLookup'
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import EventLookupAnalytics from '@/components/shared/EventLookupAnalytics'

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
    const registrations = await getRegistrationsByUser(userId);

    return (
      <div className="flex flex-col gap-10">
        {/* My Registrations Section */}
        <section className="bg-primary-50">
          <div className="wrapper py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className='h2-bold text-primary-500'>我的注册 My Registrations</h2>
              <Button asChild size="lg" className="button hidden sm:flex">
                <Link href="/#events">
                  探索更多活动 Explore More Events
                </Link>
              </Button>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <RegistrationLookup showManualInput={true} />
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        {registrations.length > 0 && (
          <section className="bg-secondary-50">
            <div className="wrapper py-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className='h2-bold text-secondary-500'>活动分析 Event Analytics</h2>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <EventLookupAnalytics registrations={registrations} />
              </div>
            </div>
          </section>
        )}

        {/* Visual Separator */}
        <div className="border-t-2 border-gray-200 mx-auto w-1/2"></div>

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