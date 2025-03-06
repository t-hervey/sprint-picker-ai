// config/database.js
module.exports = {
  url: process.env.MONGO_URI || 'your_local_fallback_connection_string'
};
