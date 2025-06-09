import { EventRegistration } from '../types/attendance';

class AttendanceApiService {
  private baseUrl = '/api';

  async fetchRegistrations(eventId: string): Promise<EventRegistration[]> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/attendees`);
    if (!response.ok) {
      throw new Error('Failed to fetch registrations');
    }
    const data = await response.json();
    return data.attendees || [];
  }

  async markAttendance(orderId: string, eventId: string, groupId: string, attended: boolean) {
    const response = await fetch(`${this.baseUrl}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, eventId, groupId, attended }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update attendance');
    }

    return response.json();
  }

  async cancelRegistration(
    eventId: string, 
    queueNumber: string, 
    orderId: string, 
    groupId: string, 
    cancelled: boolean
  ) {
    const response = await fetch(`${this.baseUrl}/cancel-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, queueNumber, orderId, groupId, cancelled }),
    });

    if (!response.ok) {
      throw new Error(`Failed to ${cancelled ? 'cancel' : 'uncancel'} registration`);
    }

    return response.json();
  }

  async deleteRegistration(eventId: string, queueNumber: string) {
    const response = await fetch(`${this.baseUrl}/delete-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, queueNumber }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete registration');
    }

    return response.json();
  }

  async updateRemarks(phoneNumber: string, name: string, remarks: string) {
    const response = await fetch(`${this.baseUrl}/tagged-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, name, remarks }),
    });

    if (!response.ok) {
      throw new Error('Failed to update remarks');
    }

    return response.json();
  }

  async fetchTaggedUsers() {
    const response = await fetch(`${this.baseUrl}/tagged-users`);
    if (!response.ok) {
      throw new Error('Failed to fetch tagged users');
    }
    return response.json();
  }

  async updateMaxSeats(eventId: string, maxSeats: number) {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/max-seats`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxSeats }),
    });

    if (!response.ok) {
      throw new Error('Failed to update max seats');
    }

    return response.json();
  }

  async exportToGoogleSheets(eventId: string, searchText?: string) {
    const queryParams = new URLSearchParams({
      eventId,
      searchText: searchText || '',
    });

    const response = await fetch(`${this.baseUrl}/google-sheets?${queryParams}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to export to Google Sheets');
    }

    return response.json();
  }
}

export const attendanceApi = new AttendanceApiService(); 