# Online Assessment Platform — Backend

A comprehensive backend system for an online assessment platform built with Node.js and Express. This platform supports exam creation, question management, proctoring, and result tracking with role-based access control.

## 🚀 Features

### Authentication & Authorization
- User registration and login with JWT-based authentication
- Role-based access control (Student, Admin, Proctor)
- Email verification and password reset functionality
- Secure password hashing with bcrypt

### Exam Management
- Create, update, and delete exams
- Schedule exams with date and time constraints
- Exam enrollment system
- Question assignment to exams
- Exam status tracking (draft, scheduled, active, completed, cancelled)
- Proctor assignment to exams
- Email reminders for scheduled exams

### Question Management
- CRUD operations for questions
- Bulk question creation
- Question categorization and topic tagging
- Question statistics and analytics

### Proctoring System
- Video monitoring support
- Browser lockdown capabilities
- Identity verification
- Tab switch detection and limiting
- Real-time proctoring event logging
- Flagged exam review system
- Active session monitoring
- Exam termination by proctors/admins

### Results & Analytics
- Exam submission and auto-grading
- Result tracking and statistics
- Exam performance analytics
- Admin dashboard statistics

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher recommended)
- **npm** (v6 or higher) or **yarn**
- **MongoDB** (running locally or MongoDB Atlas connection)
- **SMTP credentials** (for email functionality - optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Online-Assessment-Platform-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the project root with the following variables:
   
   ```env
   # Server Configuration
   PORT=5000
   
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/online_assessment
   # Or for MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   
   # Email Configuration (Optional - for email notifications)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FROM_EMAIL=noreply@assessmentplatform.com
   FROM_NAME=Online Assessment Platform
   ```

   **⚠️ Important:** Never commit your `.env` file to version control. Add it to `.gitignore`.

## 🏃 Running the Application

### Development Mode
Run the server with auto-reload using nodemon:
```bash
npm run dev
```

### Production Mode
Run the server in production:
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 5000).

Visit `http://localhost:3000` to verify the server is running.

## 📁 Project Structure

```
Online-Assessment-Platform-Backend/
├── Controllers/          # Request handlers
│   ├── authController.js
│   ├── examController.js
│   ├── questionController.js
│   ├── proctoringController.js
│   └── resultController.js
├── Database/            # Database configuration
│   └── dbConfig.js
├── Middleware/          # Custom middleware functions
│   └── Middleware.js
├── Models/              # Mongoose data models
│   ├── userModel.js
│   ├── examModel.js
│   ├── questionModel.js
│   ├── proctoringLogModel.js
│   └── resultModel.js
├── Routes/              # Express route definitions
│   ├── authRoute.js
│   ├── examRoute.js
│   ├── questionRoute.js
│   ├── proctoringRoute.js
│   └── resultRoute.js
├── Utils/               # Utility functions
│   └── mailer.js
├── index.js             # Application entry point
├── package.json         # Project dependencies and scripts
└── Readme.md            # This file
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user profile (protected)

### Questions (`/api/questions`)
- `GET /api/questions` - Get all questions (Admin only)
- `POST /api/questions` - Create a new question (Admin only)
- `POST /api/questions/bulk` - Create multiple questions (Admin only)
- `GET /api/questions/:questionId` - Get question by ID (Admin only)
- `PUT /api/questions/:questionId` - Update question (Admin only)
- `DELETE /api/questions/:questionId` - Delete question (Admin only)
- `GET /api/questions/categories` - Get all categories
- `GET /api/questions/topics` - Get all topics
- `GET /api/questions/stats` - Get question statistics (Admin only)

### Exams (`/api/exams`)
- `GET /api/exams` - Get all exams (Admin only)
- `POST /api/exams` - Create a new exam (Admin only)
- `GET /api/exams/:examId` - Get exam by ID
- `PUT /api/exams/:examId` - Update exam (Admin only)
- `DELETE /api/exams/:examId` - Delete exam (Admin only)
- `GET /api/exams/available` - Get available exams for enrollment
- `GET /api/exams/enrolled` - Get enrolled exams (Student)
- `POST /api/exams/:examId/enroll` - Enroll in an exam
- `POST /api/exams/:examId/start` - Start an exam
- `POST /api/exams/answer/:resultId` - Save answer during exam
- `POST /api/exams/submit/:resultId` - Submit exam
- `POST /api/exams/:examId/questions` - Add questions to exam (Admin only)
- `DELETE /api/exams/:examId/questions/:questionId` - Remove question from exam (Admin only)
- `GET /api/exams/stats` - Get exam statistics (Admin only)
- `POST /api/exams/:examId/proctors` - Assign proctors to exam (Admin only)
- `DELETE /api/exams/:examId/proctors/:proctorId` - Remove proctor from exam (Admin only)
- `GET /api/exams/proctors/available` - Get available proctors (Admin only)
- `GET /api/exams/proctors/my-exams` - Get proctor's assigned exams (Proctor only)
- `POST /api/exams/:examId/send-reminders` - Send exam reminders (Admin only)

### Results (`/api/results`)
- `GET /api/results` - Get all results (Admin only)
- `GET /api/results/:resultId` - Get result by ID
- `GET /api/results/exam/:examId` - Get results for an exam
- `GET /api/results/my-results` - Get current user's results
- `GET /api/results/stats` - Get result statistics (Admin only)

### Proctoring (`/api/proctoring`)
- `POST /api/proctoring/log` - Log proctoring event
- `GET /api/proctoring/logs` - Get all proctoring logs (Admin/Proctor)
- `GET /api/proctoring/logs/:studentId/:examId` - Get student's proctoring logs (Admin/Proctor)
- `PUT /api/proctoring/logs/:logId/review` - Review proctoring log (Admin/Proctor)
- `GET /api/proctoring/flagged` - Get flagged exams (Admin/Proctor)
- `GET /api/proctoring/stats` - Get proctoring statistics (Admin/Proctor)
- `GET /api/proctoring/active-sessions` - Get active exam sessions (Admin/Proctor)
- `POST /api/proctoring/terminate/:resultId` - Terminate an exam session (Admin/Proctor)

## 🔐 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- **Student**: Can enroll in exams, take exams, view results
- **Admin**: Full access to all features
- **Proctor**: Can monitor exams, review proctoring logs, terminate sessions

## 📦 Dependencies

- **express** - Web framework for Node.js
- **mongoose** - MongoDB object modeling
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variable management
- **nodemon** - Development auto-reload (dev dependency)

## 🔧 Configuration

### Database Connection
Database configuration is handled in `Database/dbConfig.js`. Ensure your MongoDB instance is running and the `MONGO_URI` in `.env` is correctly set.

### Email Configuration
Email functionality is optional. If you don't configure SMTP settings, email-related features will be disabled. The mailer utility is located in `Utils/mailer.js`.

### Middleware
Authentication and authorization middleware is located in `Middleware/Middleware.js`. This includes:
- `authenticate` - Verify JWT token
- `isAdmin` - Check if user is admin
- `isStudent` - Check if user is student
- `isProctor` - Check if user is proctor
- `authorizeRoles` - Check if user has any of the specified roles

## 🧪 Development

### Code Structure
The project follows an MVC-like architecture:
- **Models**: Define data schemas using Mongoose
- **Controllers**: Handle business logic and request processing
- **Routes**: Define API endpoints and middleware
- **Middleware**: Custom authentication and validation logic
- **Utils**: Reusable utility functions

### Adding New Features
1. Create/update the model in `Models/`
2. Create/update the controller in `Controllers/`
3. Define routes in `Routes/`
4. Register routes in `index.js`

## 🐛 Error Handling

The application includes global error handling middleware. Errors are logged to the console and returned as JSON responses with appropriate status codes.

## 📝 Notes

- The application uses ES6 modules (`import/export`)
- Request body size limit is set to 50mb for file uploads
- CORS is enabled for all origins (configure in production)
- Default server port is 5000 (configurable via `.env`)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate error handling.

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**Goutham Balaji P S**

## 🙏 Acknowledgments

- Express.js community
- MongoDB and Mongoose documentation
- All contributors and users of this platform

---

For detailed API documentation and request/response examples, refer to the individual route and controller files.
