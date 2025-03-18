export const config = {
  mongodb: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'your_database_name'
  },
  websocket: {
    port: parseInt(process.env.WS_PORT || '3001')
  }
}; 