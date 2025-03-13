// Configuration for event-related settings
export const EVENT_CONFIG = {
  // Number of days to keep showing expired events (negative number means days in the past)
  EXPIRATION_DAYS: {
    superadmin: -365, // Show events from the past year for superadmins
    admin: -2, // Show events from past 2 days for admins
    user: -2 // Show events from past 2 days for regular users
  },
  
  // Function to get the expiration date based on user role
  getExpirationDate: (role?: string) => {
    const currentDate = new Date();
    const days = EVENT_CONFIG.EXPIRATION_DAYS[role as keyof typeof EVENT_CONFIG.EXPIRATION_DAYS] || EVENT_CONFIG.EXPIRATION_DAYS.user;
    return new Date(currentDate.setDate(currentDate.getDate() + days));
  }
}; 