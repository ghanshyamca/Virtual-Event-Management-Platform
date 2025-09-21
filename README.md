# Virtual Event Management Platform

A comprehensive backend system for managing virtual events, built with Node.js and Express.js. This platform provides secure user authentication, event management capabilities, and participant registration features.

## 🚀 Features

### User Management
- **User Registration & Authentication**: Secure registration and login using bcrypt for password hashing and JWT for session management
- **Role-Based Access Control**: Support for two user roles - `organizer` and `attendee`
- **Profile Management**: Users can view and update their profiles
- **Email Notifications**: Welcome emails and event-related notifications

### Event Management
- **CRUD Operations**: Complete event lifecycle management (Create, Read, Update, Delete)
- **Event Categories**: Support for multiple event categories (technology, business, education, etc.)
- **Public/Private Events**: Organizers can create both public and private events
- **Event Scheduling**: Date, time, and duration management
- **Capacity Management**: Optional participant limits with automatic capacity tracking

### Participant Management
- **Event Registration**: Users can register for events with automatic confirmation emails
- **Registration Management**: View and manage event registrations
- **Participant Tracking**: Real-time participant count and availability
- **Unregistration**: Users can unregister from events

### Advanced Features
- **Email Notifications**: Automated emails for registration confirmations and event updates
- **Event Filtering**: Filter events by category, status, date range, and visibility
- **Pagination**: Efficient data pagination for large event lists
- **Event Statistics**: Detailed analytics for organizers
- **Security**: Rate limiting, input validation, and comprehensive error handling

## 🛠 Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email Service**: Nodemailer
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS, Rate Limiting
- **Data Storage**: Simple in-memory arrays and objects (no database required)

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Virtual-Event-Management-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   
   # Email Configuration (optional for development)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Run tests**
   ```bash
   # Run all tests
   npm test
   
   # Run tests in watch mode
   npm run test:watch
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "attendee" // or "organizer"
}
```

#### Login User
```http
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com"
}
```

#### Change Password
```http
PUT /users/change-password
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!",
  "confirmNewPassword": "NewSecurePass123!"
}
```

### Event Endpoints

#### Get All Events
```http
GET /events
# Optional query parameters:
# ?category=technology
# ?status=scheduled
# ?isPublic=true
# ?page=1&limit=10
```

#### Get Event by ID
```http
GET /events/:id
```

#### Create Event (Organizers only)
```http
POST /events
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "date": "2024-12-15T00:00:00.000Z",
  "time": "09:00",
  "duration": 480,
  "maxParticipants": 100,
  "category": "technology",
  "isPublic": true,
  "meetingLink": "https://zoom.us/j/123456789"
}
```

#### Update Event (Organizers only)
```http
PUT /events/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated Event Title",
  "description": "Updated description"
}
```

#### Delete Event (Organizers only)
```http
DELETE /events/:id
Authorization: Bearer <jwt-token>
```

#### Register for Event
```http
POST /events/:id/register
Authorization: Bearer <jwt-token>
```

#### Unregister from Event
```http
DELETE /events/:id/register
Authorization: Bearer <jwt-token>
```

#### Get My Organized Events (Organizers only)
```http
GET /events/my/organized
Authorization: Bearer <jwt-token>
```

#### Get My Event Registrations
```http
GET /events/my/registrations
Authorization: Bearer <jwt-token>
```

#### Get Event Participants (Organizers only)
```http
GET /events/:id/participants
Authorization: Bearer <jwt-token>
```

#### Get Event Statistics (Organizers only)
```http
GET /events/:id/stats
Authorization: Bearer <jwt-token>
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation using Joi schemas
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet**: Security headers for Express applications
- **Role-Based Access Control**: Different permissions for organizers and attendees

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end API testing
- **Authentication Tests**: JWT and user management testing
- **Event Management Tests**: Complete event lifecycle testing
- **Middleware Tests**: Validation and authentication middleware testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js
```

## 📁 Project Structure

```
Virtual-Event-Management-Platform/
├── controllers/           # Request handlers
│   ├── authController.js
│   └── eventController.js
├── middleware/           # Custom middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── models/              # Data models
│   ├── User.js
│   └── Event.js
├── routes/              # API routes
│   ├── auth.js
│   └── events.js
├── tests/               # Test files
│   ├── auth.test.js
│   ├── events.test.js
│   ├── models.test.js
│   ├── middleware.test.js
│   └── integration.test.js
├── utils/               # Utility functions
│   └── emailService.js
├── server.js            # Main server file
├── package.json
└── README.md
```

## 🔧 Configuration

The application uses a **centralized configuration system** with environment variables managed through `config/constants.js`.

### Constants File Benefits

- **Centralized Configuration**: All settings in one place
- **Type Safety**: Proper data type conversion
- **Default Values**: Fallback values for missing environment variables
- **Easy Maintenance**: Single source of truth for all configuration
- **Environment Validation**: Automatic validation of required settings

### Environment Variables

| Variable | Description | Default | Type |
|----------|-------------|---------|------|
| `PORT` | Server port | 3000 | Number |
| `NODE_ENV` | Environment mode | development | String |
| `HOST` | Server host | localhost | String |
| `JWT_SECRET` | JWT signing secret | fallback-secret-key | String |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h | String |
| `EMAIL_HOST` | SMTP host | smtp.gmail.com | String |
| `EMAIL_PORT` | SMTP port | 587 | Number |
| `EMAIL_USER` | SMTP username | - | String |
| `EMAIL_PASS` | SMTP password | - | String |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 | Number |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 | Number |

### Using Constants

```javascript
// Import constants
const { SERVER, JWT, EMAIL, VALIDATION } = require('./config/constants');

// Use in your code
app.listen(SERVER.PORT, () => {
  console.log(`Server running on ${SERVER.HOST}:${SERVER.PORT}`);
});

// JWT token generation
const token = jwt.sign(payload, JWT.SECRET, { expiresIn: JWT.EXPIRES_IN });

// Validation rules
const isValidPassword = password.length >= VALIDATION.PASSWORD.MIN_LENGTH;
```

### Email Configuration

For development, the system will log emails to the console if no email configuration is provided. For production, configure SMTP settings:

1. **Gmail**: Use app-specific passwords
2. **SendGrid**: Use API key authentication
3. **Other SMTP**: Configure host, port, and credentials

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set production values for all environment variables
2. **JWT Secret**: Use a strong, unique JWT secret
3. **Email Service**: Configure production email service
4. **Rate Limiting**: Adjust rate limits for production traffic
5. **Logging**: Implement production logging
6. **Database**: Replace in-memory storage with persistent database
7. **SSL/TLS**: Enable HTTPS in production

### Docker Deployment (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📝 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": [
    // Additional error details (for validation errors)
  ]
}
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "message": "Virtual Event Management Platform API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🗄️ Data Storage Architecture

This application uses **simple in-memory data structures with JSON file persistence**:

### User Storage
```javascript
// Users are stored in a simple array
userStore.users = [
  {
    id: "uuid-1",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "attendee",
    // ... other properties
  },
  // ... more users
];
```

### Event Storage
```javascript
// Events are stored in a simple array
eventStore.events = [
  {
    id: "uuid-1",
    title: "Tech Conference",
    organizerId: "organizer-uuid",
    participants: ["user-uuid-1", "user-uuid-2"], // Array of participant IDs
    // ... other properties
  },
  // ... more events
];
```

### JSON File Persistence
The application automatically saves data to JSON files for persistence:

- **Users**: Saved to `data/users.json`
- **Events**: Saved to `data/events.json`
- **Auto-save**: Data is automatically saved after every create, update, or delete operation
- **Auto-load**: Data is automatically loaded when the server starts

### Key Features
- **No Database Required**: All data stored in JavaScript arrays
- **Persistent Storage**: Data survives server restarts via JSON files
- **Simple Operations**: Uses standard array methods (`push()`, `find()`, `filter()`, `splice()`)
- **Easy to Understand**: Clear data structure for learning purposes
- **Fast Development**: No database setup or configuration needed
- **Human Readable**: JSON files can be easily viewed and edited

### Data Operations Examples
```javascript
// Find user by email
const user = userStore.users.find(u => u.email === email);

// Find events by organizer
const events = eventStore.events.filter(e => e.organizerId === organizerId);

// Add participant to event (automatically saves to JSON)
event.participants.push(userId);
eventStore.saveToFile();

// Remove participant from event (automatically saves to JSON)
const index = event.participants.indexOf(userId);
event.participants.splice(index, 1);
eventStore.saveToFile();
```

### File Structure
```
data/
├── users.json     # All user data
└── events.json    # All event data

config/
└── constants.js   # Centralized configuration and environment variables
```

## 📊 Performance Considerations

- **In-Memory Storage**: All data stored in memory with JSON file persistence
- **Pagination**: Implemented for large data sets
- **Rate Limiting**: Prevents API abuse
- **Simple Data Structures**: All data stored in JavaScript arrays for easy understanding
- **Async Operations**: Non-blocking email operations

## 🔮 Future Enhancements

- **Database Integration**: PostgreSQL/MongoDB support
- **Real-time Features**: WebSocket integration for live updates
- **File Uploads**: Event images and documents
- **Calendar Integration**: iCal/Google Calendar sync
- **Advanced Analytics**: Detailed event analytics
- **Multi-language Support**: Internationalization
- **Mobile API**: Optimized endpoints for mobile apps
- **Event Streaming**: Live streaming integration
- **Payment Integration**: Paid event support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Virtual Event Management Team** - Initial work

## 🙏 Acknowledgments

- Express.js community for the excellent framework
- JWT.io for authentication standards
- Jest team for the testing framework
- All contributors who helped improve this project

## 📞 Support

For support, email support@virtualevent.com or create an issue in the GitHub repository.

---

**Happy Event Managing! 🎉**
