# Newsx — A Modern Full-Stack Social Blogging Platform

**Live Demo** → [https://newsx.vercel.app](https://newsx-orpin.vercel.app)  
**Backend API** → [https://newsx-backend.vercel.app/api-docs](https://newsx-server-delta.vercel.app/api/v1)

[![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![TipTap](https://img.shields.io/badge/TipTap-000000?style=for-the-badge&logo=tiptap&logoColor=white)](https://tiptap.dev)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

A powerful, production-grade social blogging platform with real-time interactions, nested comments, likes, follows, notifications, and a full-featured admin dashboard — all built from scratch with modern best practices.

## Features

- **Full User Authentication**  
  Register • Login • Email verification • Password reset • JWT + refresh tokens • Secure HttpOnly cookies

- **Rich Blogging Experience**  
  Create/edit/delete posts • TipTap rich text editor • Image uploads via Cloudinary • Markdown support

- **Advanced Social Interactions**  
  Like/dislike posts & comments • Follow/unfollow users • Follower/following feeds • Real-time notifications

- **Deep Nested Comments**  
  Up to 5 levels of threaded replies • Like/dislike comments • Reply directly to any comment

- **Powerful Admin Dashboard**  
  Manage users, posts, comments • Suspend/unsuspend content • View analytics • Full CRUD control

- **Smart Search**  
  Search posts by title • Search users by name/username/email • Search comments

- **Complete Account Deletion**  
  Permanently removes: posts, comments, likes, followers, notifications, avatar (Cloudinary), tokens

- **API-First Design**  
  Fully documented with **Swagger UI** at `/api-docs` • RESTful endpoints • Consistent error handling

- **Production Ready**  
  Responsive Tailwind UI • SEO optimized • Serverless deployment on Vercel • Type-safe where possible

## Tech Stack

| Layer             | Technology                                                                 |
|-------------------|----------------------------------------------------------------------------|
| Frontend          | Next.js 15 (App Router), React 19, Tailwind CSS, TipTap, Axios, Swiper     |
| Backend           | Express.js, MongoDB (Mongoose), JWT, Cloudinary, Nodemailer                |
| Auth              | JWT Access + Refresh Tokens, HttpOnly Cookies                              |
| Documentation     | Swagger Autogen + Swagger UI                                              |
| Deployment        | Vercel (Frontend + Serverless Backend)                                     |
| Styling           | Tailwind CSS + Headless UI components                                      |
| Forms & Validation| React Hook Form + Zod                                                      |
| Notifications     | React Hot Toast                                                            |

## Project Structure

```
newsx/
├── frontend/           # Next.js 15 App Router
│   └── src/app/        # Pages, components, context
├── backend/
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # Express routes
│   │   ├── models/        # Mongoose schemas
│   │   ├── middleware/    # Auth, error handling, multer
│   │   └── utils/         # Cloudinary, email, ApiResponse
│   └── swagger.mjs        # Auto-generated API docs
└── README.md
```

## Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/mahdimonir/Newsx.git
cd Newsx

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Setup

**Backend (.env in /backend)**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/newsx
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=your_secret
NODEMAILER_EMAIL=your@gmail.com
NODEMAILER_PASSWORD=your-app-password
```

**Frontend (.env.local in /frontend)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 3. Run

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open → [http://localhost:3000](http://localhost:3000)

### Demo Accounts

| Role   | Email                      | Password   | Username     |
|--------|----------------------------|------------|--------------|
| Admin  | `test.admin@example.com`   | `12345678` | `test.admin` |
| User   | `test.user@example.com`    | `12345678` | `test.user`  |

> Admin: After login → go to `/admin`  
> To make any user admin:  
> ```js
> db.users.updateOne({email: "..."}, {$set: {role: "admin"}})
> ```

## Deployment (Vercel)

Both frontend and backend are deployed on Vercel as serverless functions.

```bash
vercel --prod    # from each folder
```

Add all environment variables in Vercel Dashboard → Settings → Environment Variables

## API Documentation

Live Swagger UI → [https://newsx-backend.vercel.app/api-docs](https://newsx-server-delta.vercel.app/api-docs)

## License

[ISC License](LICENSE) — feel free to use, study, or fork.

## Author

**Mahdi Moniruzzaman**  
Full-Stack Developer | Next.js & Node.js Specialist

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mahdimonir)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/moniruzzamanmahdi)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://moniruzzaman-mahdi.vercel.app)

---
