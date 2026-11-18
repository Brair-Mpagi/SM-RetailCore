# SM-RetailCore

SM-RetailCore is a supermarket retail management system for handling sales, inventory, users, suppliers, and other store operations.

The system consists of an Express.js backend, a MySQL database, and a Next.js frontend currently being migrated from the previous React/Vite implementation.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, Express.js |
| ORM | Sequelize |
| Database | MySQL |
| Session and caching | Redis |
| Authentication | JWT |
| Testing | Jest |
| Development environment | Linux |

## Project Structure

```text
SM-RetailCore/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── migrations/
│   │   └── server.js
│   ├── __tests__/
│   ├── package.json
│   └── .env
├── frontend-next/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── lib/
│       └── types/
├── database/
│   └── rstms_db.sql
├── .assessment/
└── HOW_TO_RUN.md
```

## Requirements

Before running the application, install the following:

- Node.js 18 or later
- npm
- MySQL
- Redis
- Git

MySQL and Redis must be running before starting the backend.

## Local Development

### 1. Start MySQL

If using XAMPP:

```bash
sudo /opt/lampp/lampp startmysql
```

Verify the database is accessible:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -e "SELECT 1;"
```

### 2. Create the Database

Create the application database:

```sql
CREATE DATABASE rstms_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Create a dedicated database user and grant access to the application database.

```sql
CREATE USER 'rstms_user'@'localhost'
IDENTIFIED BY 'your_database_password';

GRANT ALL PRIVILEGES ON rstms_db.*
TO 'rstms_user'@'localhost';

FLUSH PRIVILEGES;
```

Use a different password for your local environment and production deployment.

### 3. Configure the Backend

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file using the configuration below.

```env
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=rstms_db
DB_USER=rstms_user
DB_PASS=your_database_password
DB_DIALECT=mysql

JWT_SECRET=replace_with_a_secure_random_secret
JWT_REFRESH_SECRET=replace_with_another_secure_random_secret
JWT_EXPIRY=8h
JWT_REFRESH_EXPIRY=7d

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

VAT_RATE=0.18
CURRENCY=UGX

LOG_LEVEL=info
LOG_DIR=logs
```

Do not commit `.env` files or production credentials to Git.

### 4. Start Redis

In a separate terminal:

```bash
redis-server
```

Verify the connection:

```bash
redis-cli ping
```

Expected response:

```text
PONG
```

Redis is used for session management, token revocation, rate limiting, and caching.

### 5. Initialize the Database

From the backend directory:

```bash
npm run seed
```

This initializes the database with sample data for development, including users, product categories, and suppliers.

Do not run development seed scripts against a production database.

### 6. Start the Backend

```bash
npm start
```

For development with automatic reload:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:3000
```

API base path:

```text
http://localhost:3000/api/v1
```

Health check:

```text
http://localhost:3000/health
```

### 7. Start the Frontend

Open another terminal:

```bash
cd frontend-next
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=SM-RetailCore
```

Start the development server:

```bash
npm run dev
```

The frontend will run on the default Next.js development port, usually:

```text
http://localhost:3000
```

If the backend is already using that port, Next.js will select another available port. Configure the services to use separate ports where necessary.

## Testing

Backend tests are run using Jest.

```bash
cd backend
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

Run a specific test suite:

```bash
npm test -- transactions.test.js
```

The existing test suites cover authentication and transaction-related functionality, including input validation, price verification, idempotency, and rate limiting.

## API

All application endpoints are available under:

```text
/api/v1
```

Health check:

```bash
curl http://localhost:3000/health
```

Example authentication request:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"your_password"}'
```

Refer to the backend routes for the available endpoints and request formats.

## Security

The backend includes security controls for authentication, transactions, and API requests.

Current implementations include:

- Input validation
- Rate limiting
- Token revocation
- Server-side transaction price verification
- Database locking for transaction processing
- Request idempotency
- Structured logging

Security configuration should be reviewed and tested before deployment. Development credentials, secrets, and sample data must not be used in a production environment.

## Production Deployment

Production deployment requires a properly configured server environment.

Recommended components:

- MySQL database
- Redis
- Node.js
- Process manager
- Nginx reverse proxy
- HTTPS certificates
- Firewall configuration
- Database backups
- Application monitoring and logging

Configure production environment variables before starting the application.

### Build the Frontend

```bash
cd frontend-next
npm run build
```

### Start the Backend

```bash
cd backend
NODE_ENV=production npm start
```

For process management, PM2 can be used:

```bash
pm2 start src/server.js --name sm-retailcore-api
pm2 save
```

Configure Nginx to route frontend requests and API requests to their respective services. HTTPS should be enabled for all external traffic.

## Database Management

Connect to MySQL:

```bash
mysql -h 127.0.0.1 -P 3306 \
  -u rstms_user -p rstms_db
```

Example queries:

```sql
-- Users
SELECT id, name, email, role
FROM users;

-- Recent transactions
SELECT receipt_number, total_amount, payment_method, created_at
FROM sales_transactions
ORDER BY created_at DESC
LIMIT 10;

-- Open cash sessions
SELECT *
FROM cash_sessions
WHERE status = 'open';
```

### Backups

Create a database backup:

```bash
mysqldump -h 127.0.0.1 -u rstms_user -p rstms_db > backup.sql
```

Restore a backup:

```bash
mysql -h 127.0.0.1 -u rstms_user -p rstms_db < backup.sql
```

Backups should be stored securely and tested periodically.

## Troubleshooting

### MySQL connection refused

Check whether MySQL is running:

```bash
sudo /opt/lampp/lampp status
```

Verify the host, port, database name, and credentials in the backend `.env` file.

### Port already in use

Find the process using a port:

```bash
sudo lsof -i :3000
```

Stop the process or configure the application to use another port.

### Redis connection error

Check Redis:

```bash
redis-cli ping
```

Start the service if it is not running.

### Invalid login credentials

Ensure the database has been initialized and the required user records exist. For development, run the seed script if necessary.

### Tests failing

Install dependencies and run the tests again:

```bash
npm install
npm test
```

Check the test output and application logs for the cause of the failure.

## Development Status

The backend and its supporting services are under active development. The frontend is being migrated to Next.js.

Refer to the project documentation in `.assessment/` for the technical assessment, implementation plan, and migration notes.

---
