require('dotenv').config({
  path: require('path').resolve(__dirname, '.env'),
});

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

require('./src/models/index');

const { initSocket } = require('./src/socket');
const { startNoShowChecker } = require('./src/jobs/noShowChecker');
const { startManagerAlerts } = require('./src/jobs/managerAlerts');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);

connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);

      startNoShowChecker();
      startManagerAlerts();
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });