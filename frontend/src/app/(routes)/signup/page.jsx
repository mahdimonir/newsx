"use client";

import GoogleButton from "@/app/assets/google-button/index";
import { API_URL } from "@/server.js";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

const Signup = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]); // 4-digit OTP
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setServerError(null);
      setLoading(true);

      const res = await axios.post(`${API_URL}/auth/signup`, data, {
        withCredentials: true,
      });

      setUserData(data);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);

      toast.success("Signup successful! Enter the OTP sent to your email.");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Something went wrong";
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

  const verifyOtp = async () => {
    try {
      setOtpLoading(true);
      setServerError(null);

      const enteredOtp = otp.join("").trim().toString();
      if (!enteredOtp || enteredOtp.length !== otp.length) {
        throw new Error("Please enter a complete OTP");
      }
      if (!userData?.email) {
        throw new Error("Email not found. Please sign up again.");
      }

      const res = await axios.post(
        `${API_URL}/auth/verify`,
        {
          email: userData.email,
          otp: enteredOtp,
        },
        {
          withCredentials: true,
        }
      );

      if (res.status === 200) {
        setOtp(Array(otp.length).fill(""));
        toast.success("OTP Verified! Redirecting to login...");
        router.push("/login");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "OTP verification failed";
      if (errorMessage === "User already verified") {
        toast.success("Account already verified! Redirecting to login...");
        router.push("/login");
      } else {
        setServerError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setResendLoading(true);
      setCanResend(false);
      setTimer(60);

      await axios.post(
        `${API_URL}/auth/resend-otp`,
        {
          email: userData.email,
        },
        {
          withCredentials: true,
        }
      );

      toast.success("OTP resent successfully!");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to resend OTP";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    let timeout;
    if (showOtp && timer > 0 && !canResend) {
      timeout = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timeout);
  }, [timer, showOtp, canResend]);

  return (
    <div className="w-full py-10 min-h-[100vh] bg-gray-50 dark:bg-gray-900">
      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white dark:bg-gray-800 shadow rounded-lg">
          <h3 className="text-3xl text-gray-800 dark:text-gray-100 font-semibold text-center mb-2">
            Sign up to Newsx
          </h3>
          <p className="text-center text-gray-500 mb-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary">
              Login
            </Link>
          </p>

          <GoogleButton />

          <div className="flex items-center my-5 text-gray-400 dark:text-gray-500 text-sm">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
            <span className="px-3">or Sign up with Email</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="John Abraham"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                disabled={loading}
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}

              <label className="block text-gray-700 dark:text-gray-300 mb-1 mt-3">
                Email
              </label>
              <input
                type="email"
                placeholder="support@newsx.com"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                disabled={loading}
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

              <label className="block text-gray-700 dark:text-gray-300 mb-1 mt-3">
                Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                  disabled={loading}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full text-lg cursor-pointer bg-primary hover:bg-violet-600 text-white mt-4 py-2 rounded-lg"
              >
                {loading ? "Signing up..." : "Signup"}
              </button>

              {serverError && (
                <p className="text-red-500 text-sm mt-2">{serverError}</p>
              )}
            </form>
          ) : (
            <div>
              <h3 className="text-xl text-gray-900 dark:text-gray-100 font-semibold text-center mb-4">
                Enter OTP
              </h3>
              <div className="flex justify-center gap-4">
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
                    onInput={(e) => {
                      if (e.target.value.length > 1)
                        e.target.value = e.target.value.slice(0, 1);
                    }}
                  />
                ))}
              </div>

              <button
                className="w-full mt-6 text-lg cursor-pointer bg-primary hover:bg-violet-600 text-white py-2 rounded-lg"
                onClick={verifyOtp}
                disabled={otp.some((d) => d === "") || otpLoading}
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="text-center text-sm mt-4">
                <button
                  className="text-primary cursor-pointer disabled:opacity-50"
                  disabled={!canResend || resendLoading}
                  onClick={resendOtp}
                >
                  {canResend
                    ? resendLoading
                      ? "Resending..."
                      : "Resend OTP"
                    : `Resend in ${timer}s`}
                </button>
              </div>

              {serverError && (
                <p className="text-red-500 text-sm mt-2">{serverError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
