import Collection from '@/components/shared/Collection'
import RegistrationCollection from '@/components/shared/RegistrationCollection'

import { Button } from '@/components/ui/button'
import { getRegistrationsByUser } from '@/lib/actions/registration.actions'
import { getEventsByUser } from '@/lib/actions/event.actions'
import { IRegistration } from '@/types'
import { auth, currentUser } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'

const ProfilePage = async ({ searchParams }: { searchParams: any }) => {
  try {
    const user = await currentUser();
    
    if (!user || !user.publicMetadata) {
      // Handle the case where the user is not authenticated or publicMetadata is missing
      return <div>User not authenticated or missing metadata</div>;
    }

    const userId = user.publicMetadata.userId as string;

    const registrationsPage = Number(searchParams?.registrationsPage) || 1;
    const eventsPage = Number(searchParams?.eventsPage) || 1;

    // Fetch aggregated registrations
    const registrations: IRegistration[] = await getRegistrationsByUser(userId);
    console.log('Fetched registrations:', registrations);

    // Fetch organized events
    const organizedEventsData = await getEventsByUser({ userId, page: eventsPage }) || { data: [], totalPages: 0 };
    console.log('Fetched organized events:', organizedEventsData);

    return (
      <>
        {/* My Registrations */}
        <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
          <div className="wrapper flex items-center justify-center sm:justify-between">
            <h3 className='h3-bold text-center sm:text-left'>My Registrations 排队号码</h3>
            <Button asChild size="lg" className="button hidden sm:flex">
              <Link href="/#events">
                Explore More Events
              </Link>
            </Button>
          </div>
        </section>

        <section className="wrapper my-8">
          <RegistrationCollection 
            data={registrations}
            emptyTitle="No registrations yet"
            emptyStateSubtext="No worries - plenty of exciting events to explore!"
            collectionType="My_Registrations"
            limit={3}
            page={registrationsPage}
            urlParamName="registrationsPage"
            totalPages={Math.ceil(registrations.length / 3)}
          />
        </section>

        {/* Events Organized */}
        <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
          <div className="wrapper flex items-center justify-center sm:justify-between">
            <h3 className='h3-bold text-center sm:text-left'>Events Organized</h3>
            <Button asChild size="lg" className="button hidden sm:flex">
              <Link href="/events/create">
                Create New Event
              </Link>
            </Button>
          </div>
        </section>

        <section className="wrapper my-8">
          <Collection 
            data={organizedEventsData.data}
            emptyTitle="No events have been created yet"
            emptyStateSubtext="Go create some now"
            collectionType="Events_Organized"
            limit={3}
            page={eventsPage}
            urlParamName="eventsPage"
            totalPages={organizedEventsData.totalPages}
          />
        </section>
      </>
    )
  } catch (error) {
    console.error('Error in ProfilePage:', error);
    return <div>Something went wrong. Please try again later.</div>;
  }
}

export default ProfilePage