# Newsx

Newsx is a full-stack blog application built with Next.js (React) for the frontend, Express.js for the backend, MongoDB for the database, and JWT for authentication. It enables users to register, log in, create/edit/delete blog posts, comment on posts, like/dislike posts or comments, follow other users, and includes an admin dashboard for managing users and content.

## Features

- **User Authentication**: Register, login, logout, email verification, password reset, and JWT-based authentication with refresh tokens.
- **Blog Posts**: Create, edit, and delete posts with image uploads (stored on Cloudinary).
- **Nested Comments**: Commenting system with up to 5 levels of nested replies.
- **Likes/Dislikes**: Like or dislike posts and comments.
- **Social Features**: Follow/unfollow users with follower and following lists.
- **Admin Dashboard**: Manage users, posts, and comments (toggle suspension, view suspended content).
- **Search Functionality**: Search posts by title, users by name/email/username, and comments by content.
- **Responsive Design**: Built with Tailwind CSS for a mobile-friendly UI.
- **SEO**: Basic SEO with Next.js metadata and dynamic meta tags.
- **API Documentation**: Swagger UI at `/api-docs` for backend API exploration.
- **Error Handling**: Robust error handling with custom API responses.
- **Notifications**: Real-time notifications for likes, comments, and follows (stored in MongoDB).
- **User Deletion**: Comprehensive account deletion, removing posts, comments, likes, followers, following, notifications, and avatar.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Axios, React Hook Form, Lucide React, Swiper, React Hot Toast, TipTap (rich text editor)
- **Backend**: Express.js, MongoDB, Mongoose, JWT, Swagger Autogen, Cloudinary, Multer, Nodemailer
- **Authentication**: JWT with access and refresh tokens
- **Deployment**: Vercel (frontend and backend)

## Prerequisites

Ensure the following are installed before setting up the project:

- **Node.js** (v18 or higher): [Download](https://nodejs.org/)
- **MongoDB**: Local instance or MongoDB Atlas ([Setup Guide](https://www.mongodb.com/docs/atlas/getting-started/))
- **Git**: For cloning the repository ([Download](https://git-scm.com/))
- **Code Editor**: VS Code or similar
- **Package Manager**: npm (included with Node.js) or yarn

## Demo Accounts

For testing purposes, use the following demo accounts:

- **Admin Account**:

  - Email: `test.admin@example.com`
  - Username: `test.admin`
  - Password: `12345678`
  - Role: Admin (access to dashboard for managing users, posts, and comments)

- **User Account**:
  - Email: `test.user@example.com`
  - Username: `test.user`
  - Password: `12345678`
  - Role: User (standard user features like posting, commenting, liking)

**Note**: These accounts must be seeded in the database or created via the `/api/v1/auth/signup` endpoint. For the admin account, manually set the `role` to `admin` in MongoDB after signup (see "Testing the Application" below).

## Project Structure

```
newsx/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── commentController.js
│   │   │   ├── likeController.js
│   │   │   ├── postController.js
│   │   │   ├── userController.js
│   │   ├── db/
│   │   │   ├── index.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── multerMiddleware.js
│   │   ├── models/
│   │   │   ├── commentModel.js
│   │   │   ├── likeModel.js
│   │   │   ├── postModel.js
│   │   │   ├── userModel.js
│   │   │   ├── notificationModel.js
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── commentRoutes.js
│   │   │   ├── likeRoutes.js
│   │   │   ├── postRoutes.js
│   │   │   ├── userRoutes.js
│   │   ├── utils/
│   │   │   ├── email-templates/
│   │   │   │   ├── mail-template.ejs
│   │   │   ├── sendMail/
│   │   │   │   ├── index.js
│   │   │   ├── ApiError.js
│   │   │   ├── ApiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── cloudinary.js
│   │   ├── app.js
│   │   ├── index.js
│   │   ├── swagger-output.json
│   │   ├── swagger.mjs
│   ├── .env
│   ├── package.json
│   ├── vercel.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (routes)/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── globals.css
│   │   │   ├── layout.js
│   │   │   ├── page.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   ├── middleware.js
│   │   ├── server.js
│   ├── public/
│   ├── .env.local
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
├── README.md
```

## Setup Instructions

### 1. Clone the Repository

Clone the project to your local machine:

```bash
git clone https://github.com/mahdimonir/Newsx.git
cd newsx
```

### 2. Backend Setup

1. **Navigate to the Backend Directory**:

   ```bash
   cd backend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

   Installs dependencies:

   - **Runtime**: `bcryptjs`, `cloudinary`, `cookie-parser`, `cors`, `dotenv`, `ejs`, `express`, `jsonwebtoken`, `mongoose`, `mongoose-aggregate-paginate-v2`, `multer`, `nodemailer`, `swagger-autogen`, `swagger-ui-express`
   - **Development**: `nodemon`

3. **Create `.env` File**:
   In the `backend/` directory, create a `.env` file with:

   ```
   MONGO_URI=mongodb://localhost:27017/newsx
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   NODEMAILER_EMAIL=your_email@example.com
   NODEMAILER_PASSWORD=your_email_password
   ```

   - **MONGO_URI**: MongoDB connection string (local or MongoDB Atlas, e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/newsx?retryWrites=true&w=majority`).
   - **JWT_SECRET**: Secure key (e.g., `openssl rand -base64 32`).
   - **PORT**: Default is 5000.
   - **CLOUDINARY\_\***: From Cloudinary dashboard for image uploads.
   - **NODEMAILER\_\***: Email credentials for OTPs (e.g., Gmail App Password).

4. **Run MongoDB**:

   - Local: Start with `mongod`.
   - MongoDB Atlas: Ensure IP is whitelisted and cluster is running.

5. **Generate Swagger Documentation**:

   ```bash
   node swagger.mjs
   ```

   Generates `swagger-output.json` for API documentation.

6. **Start the Backend Server**:

   - Development (auto-reload):
     ```bash
     npm run dev
     ```
   - Production:
     ```bash
     npm start
     ```

   Server runs at `http://localhost:5000`. Verify "MongoDB connected" and "Server running on port 5000". Access Swagger UI at `http://localhost:5000/api-docs`.

### 3. Frontend Setup

1. **Navigate to the Frontend Directory**:

   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

   Installs dependencies:

   - **Runtime**: `@tiptap/react`, `@tiptap/starter-kit`, `axios`, `date-fns`, `jose`, `lottie-react`, `lucide-react`, `next`, `react`, `react-dom`, `react-hook-form`, `react-hot-toast`, `react-spinner`, `react-spinners`, `react-tag-input-component`, `swiper`
   - **Development**: `@tailwindcss/postcss`, `@tailwindcss/typography`, `tailwindcss`

3. **Configure Tailwind CSS**:
   Verify `tailwind.config.js` and `postcss.config.js`:

   **tailwind.config.js**:

   ```javascript
   module.exports = {
     content: [
       "./src/app/**/*.{js,ts,jsx,tsx}",
       "./src/pages/**/*.{js,ts,jsx,tsx}",
       "./src/components/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [require("@tailwindcss/typography")],
   };
   ```

   **postcss.config.js**:

   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```

4. **Configure Backend API URL**:
   Create a `.env.local` file in `frontend/`:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```

   Update to deployed backend URL (e.g., `https://blog-sphere-backend-ruby.vercel.app/api/v1`) after deployment.

5. **Start the Frontend Server**:

   ```bash
   npm run dev
   ```

   Runs at `http://localhost:3000`. For production, use `npm run build` and `npm start`. Run `npm run lint` to check code quality.

### 4. Testing the Application

1. **Open the Frontend**:
   Visit `http://localhost:3000`:

   - View homepage with search bar and post list.
   - Log in with demo accounts (`test.admin`, `test.user`, password: `12345678`).
   - Register a new user and verify email with OTP.
   - Create posts with TipTap editor, comment, like/dislike, follow users.

2. **Test Admin Features**:

   - Log in as `test.admin@example.com`.
   - Set admin role if needed:
     ```bash
     mongosh
     use newsx
     db.users.updateOne({ email: "test.admin@example.com" }, { $set: { role: "admin" } });
     ```
   - Use admin dashboard to suspend/unsuspend users, posts, comments.

3. **Test User Deletion**:

   - Log in as `test.user@example.com`.
   - Go to profile settings, select "Delete Account."
   - Verify removal of posts, comments, likes, followers, following, notifications, avatar.
   - Confirm cookies (`accessToken`, `refreshToken`) are cleared and user is logged out.

4. **Test Error Handling**:

   - Try invalid login credentials.
   - Submit empty post titles/comments.
   - Access protected routes (e.g., `/create`) without authentication.
   - Check browser console/network tab for errors.

5. **Test Swagger UI**:
   - Visit `http://localhost:5000/api-docs`.
   - Test endpoints: `/api/v1/auth/signup`, `/api/v1/posts`, `/api/v1/comments`, `/api/v1/auth/delete-user`.

### 5. Deployment

#### Backend Deployment (Vercel)

1. **Push to Git**:

   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial backend commit"
   git remote add origin https://github.com/mahdimonir/Newsx.git
   git push origin main
   ```

2. **Deploy to Vercel**:

   - Install Vercel CLI:
     ```bash
     npm install -g vercel
     ```
   - Log in:
     ```bash
     vercel login
     ```
   - Deploy:
     ```bash
     vercel
     ```
   - Set environment variables:
     ```bash
     vercel env add MONGO_URI
     vercel env add JWT_SECRET
     vercel env add PORT
     vercel env add CLOUDINARY_CLOUD_NAME
     vercel env add CLOUDINARY_API_KEY
     vercel env add CLOUDINARY_API_SECRET
     vercel env add NODEMAILER_EMAIL
     vercel env add NODEMAILER_PASSWORD
     ```

3. **Configure Vercel**:
   Create `vercel.json` in `backend/`:

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/index.js"
       }
     ]
   }
   ```

   Ensure `src/index.js` exports the Express app (`module.exports = app`).

#### Frontend Deployment (Vercel)

1. **Push to Git**:

   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial frontend commit"
   git remote add origin https://github.com/mahdimonir/Newsx.git
   git push origin main
   ```

2. **Deploy to Vercel**:

   - Deploy:
     ```bash
     vercel
     ```
   - Configure:
     - Build command: `npm run build`
     - Output directory: `.next`
     - Environment variable:
       ```bash
       vercel env add NEXT_PUBLIC_API_URL
       ```

3. **Update API Calls**:

   ```javascript
   const res = await fetch(
     `${process.env.NEXT_PUBLIC_API_URL}/posts?search=${search}`,
     { headers: { Authorization: `Bearer ${token}` } }
   );
   ```

### 6. Troubleshooting

- **MongoDB Connection**:

  - Verify `MONGO_URI`, IP whitelisting in Atlas.
  - Check logs: `mongod --logpath ./mongod.log`.
  - Ensure replica set for transactions (user deletion).

- **CORS Errors**:

  - Update `src/app.js`:
    ```javascript
    app.use(
      cors({
        origin: ["http://localhost:3000", "https://your-frontend.vercel.app"],
        credentials: true,
      })
    );
    ```

- **Script Errors**:

  - Verify `next.config.js`, `tailwind.config.js`, `postcss.config.js`.
  - Run `npm run build` for frontend errors.

- **JWT Errors**:

  - Ensure `JWT_SECRET` consistency.
  - Check `Authorization: Bearer <token>`.

- **Swagger UI**:

  - Verify `swagger-output.json`:
    ```javascript
    import swaggerUi from "swagger-ui-express";
    import swaggerDocument from "./swagger-output.json" assert { type: "json" };
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    ```
  - Re-run `node swagger.mjs`.

- **User Deletion**:

  - Check MongoDB for residual data.
  - Verify Cloudinary avatar deletion.
  - Ensure MongoDB transactions (replica set).
  - Confirm cookie clearing in browser.

- **Deployment**:
  - Check Vercel build logs.
  - Verify environment variables.
  - Test serverless compatibility (`src/index.js`).

### 7. Optional Enhancements

- **Social Login**: Add Google OAuth with `next-auth`.
- **SEO**: Dynamic meta tags with `next/head`.
- **Image Optimization**: Use Next.js `Image` for lazy loading.
- **Real-Time**: WebSocket notifications with Socket.IO.
- **Soft Deletion**: Mark accounts as `isDeleted: true`.
- **Audit Logging**: Log deletion actions in `logs` collection.

## Contributing

Fork the repository, make changes, submit pull requests. Open issues for major changes.

## License

Licensed under the ISC License.

## Author

Mahdi Moniruzzaman

## Repository

[https://github.com/mahdimonir/Newsx](https://github.com/mahdimonir/Newsx)
