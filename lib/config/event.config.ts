// Configuration for event-related settings
export const EVENT_CONFIG = {
  // Number of days to keep showing expired events (negative number means days in the past)
  EXPIRATION_DAYS: -2,
  
  // Function to get the expiration date
  getExpirationDate: () => {
    const currentDate = new Date();
    return new Date(currentDate.setDate(currentDate.getDate() + EVENT_CONFIG.EXPIRATION_DAYS));
  }
}; 