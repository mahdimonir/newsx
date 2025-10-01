"use client";

import GoogleButton from "@/app/assets/google-button/index.jsx";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  const router = useRouter();
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const storedRememberMe = localStorage.getItem("rememberMe") === "true";
      setRememberMe(storedRememberMe);
    }
  }, []);

  const handleRememberMeChange = () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("rememberMe", newValue.toString());
      if (!newValue) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  };

  const isEmail = (input) => {
    // Basic email regex: checks for @ and domain
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  const onLogin = async ({ credential, password }) => {
    try {
      setServerError("");
      setLoading(true);

      // Determine if credential is email or username
      const payload = {
        [isEmail(credential) ? "email" : "userName"]: credential,
        password,
        rememberMe,
      };

      const res = await axiosInstance.post("/auth/login", payload, {
        withCredentials: true,
      });

      if (res.status === 200 && res.data.success) {
        const userData = res.data.data.user;
        const token = res.data.data.accessToken;

        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("rememberMe", rememberMe.toString());
          if (rememberMe) {
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("token", token);
          } else {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
          }
        }

        setUser(userData);

        toast.success(res.data.message || "Login successful!");
        router.push("/");
      } else {
        throw new Error(res.data.message || "Login failed");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Invalid email/username or password";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRequestOtp = async ({ email }) => {
    try {
      setServerError("");
      setLoading(true);

      const res = await axiosInstance.post(
        "/auth/forget-password",
        { email },
        { withCredentials: true }
      );

      if (res.status === 200 && res.data.success) {
        setUserEmail(email);
        setShowOtpForm(true);
        setCanResend(false);
        setTimer(60);
        toast.success(res.data.message || "OTP sent to your email!");
      } else {
        throw new Error(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to send OTP";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async ({ password, confirmPassword }) => {
    try {
      setServerError("");
      setOtpLoading(true);

      const enteredOtp = otp.join("").trim().toString();
      if (!enteredOtp || enteredOtp.length !== 4) {
        throw new Error("Please enter a complete 4-digit OTP");
      }
      if (!userEmail) {
        throw new Error("Email not found. Please start over.");
      }

      const res = await axiosInstance.post(
        "/auth/reset-password",
        { email: userEmail, otp: enteredOtp, password },
        { withCredentials: true }
      );

      if (res.status === 200 && res.data.success) {
        setOtp(Array(4).fill(""));
        toast.success(res.data.message || "Password reset successfully!");
        setTimeout(() => {
          setShowForgotPassword(false);
          setShowOtpForm(false);
        }, 2000);
      } else {
        throw new Error(res.data.message || "Failed to reset password");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Password reset failed";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setServerError("");
      setLoading(true);
      setCanResend(false);
      setTimer(60);

      const res = await axiosInstance.post(
        "/auth/forget-password",
        { email: userEmail },
        { withCredentials: true }
      );

      if (res.status === 200 && res.data.success) {
        toast.success(res.data.message || "New OTP sent successfully!");
      } else {
        throw new Error(res.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to resend OTP";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    let timeout;
    if (showOtpForm && timer > 0 && !canResend) {
      timeout = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timeout);
  }, [timer, showOtpForm, canResend]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axiosInstance.get("/users/profile/me");
        if (res.status === 200) {
          router.push("/");
        }
      } catch {
        // Not authenticated, no action needed
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="w-full py-10 min-h-[100vh] bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white dark:bg-gray-800 shadow rounded-lg">
          <h3 className="text-3xl font-semibold text-center mb-2 text-gray-800 dark:text-gray-100">
            {showForgotPassword ? "Reset Your Password" : "Login to Newsx"}
          </h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
            {showForgotPassword ? (
              <>
                Remember your password?{" "}
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setShowOtpForm(false);
                    setServerError("");
                  }}
                  className="text-primary"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary">
                  Sign up
                </Link>
              </>
            )}
          </p>

          {!showForgotPassword ? (
            <>
              <GoogleButton />

              <div className="flex items-center my-5 text-gray-400 dark:text-gray-500 text-sm">
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
                <span className="px-3">or Sign in with Email or Username</span>
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
              </div>

              <form onSubmit={handleSubmit(onLogin)}>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">
                  Email or Username
                </label>
                <input
                  type="text"
                  placeholder="Enter email or username"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                  disabled={loading}
                  aria-label="Email or username"
                  {...register("credential", {
                    required: "Email or username is required",
                  })}
                />
                {errors.credential && (
                  <p className="text-red-500 text-sm">
                    {errors.credential.message}
                  </p>
                )}

                <label className="block text-gray-700 dark:text-gray-300 mb-1 mt-4">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                    disabled={loading}
                    aria-label="Password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500"
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                  >
                    {passwordVisible ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}

                <div className="flex justify-between items-center my-4">
                  <label className="text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={rememberMe}
                      onChange={handleRememberMeChange}
                      disabled={loading}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setServerError("");
                    }}
                    className="text-primary text-sm"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-lg cursor-pointer bg-primary hover:bg-violet-600 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                {serverError && (
                  <p className="text-red-500 text-sm mt-2">{serverError}</p>
                )}
              </form>
            </>
          ) : !showOtpForm ? (
            <form onSubmit={handleSubmit(onRequestOtp)}>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="support@newsx.com"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                disabled={loading}
                aria-label="Email address"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-lg cursor-pointer bg-primary hover:bg-violet-600 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>

              {serverError && (
                <p className="text-red-500 text-sm mt-2">{serverError}</p>
              )}
            </form>
          ) : (
            <form onSubmit={handleSubmit(onResetPassword)}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-4">
                Enter 4-Digit OTP and New Password
              </h3>

              <div className="flex justify-center gap-4 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="w-14 h-14 text-center border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none rounded text-xl"
                    disabled={otpLoading}
                    aria-label={`OTP digit ${index + 1}`}
                    onInput={(e) => {
                      if (e.target.value.length > 1)
                        e.target.value = e.target.value.slice(0, 1);
                    }}
                  />
                ))}
              </div>

              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                  disabled={otpLoading}
                  aria-label="New password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  aria-label={
                    passwordVisible ? "Hide password" : "Show password"
                  }
                >
                  {passwordVisible ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}

              <label className="block text-gray-700 dark:text-gray-300 mb-1 mt-4">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                  disabled={otpLoading}
                  aria-label="Confirm new password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === getValues("password") ||
                      "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  aria-label={
                    passwordVisible ? "Hide password" : "Show password"
                  }
                >
                  {passwordVisible ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}

              <button
                type="submit"
                disabled={otp.some((d) => d === "") || otpLoading}
                className="w-full text-lg cursor-pointer bg-primary hover:bg-violet-600 text-white mt-4 py-2 rounded-lg disabled:opacity-50"
              >
                {otpLoading ? "Resetting Password..." : "Reset Password"}
              </button>

              <div className="text-center text-sm mt-4">
                <button
                  className="text-violet-600 cursor-pointer disabled:opacity-50"
                  disabled={!canResend || loading}
                  onClick={resendOtp}
                >
                  {canResend
                    ? loading
                      ? "Resending..."
                      : "Resend OTP"
                    : `Resend in ${timer}s`}
                </button>
              </div>

              {serverError && (
                <p className="text-red-500 text-sm mt-2">{serverError}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
