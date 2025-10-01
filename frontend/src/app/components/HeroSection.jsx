"use client";

import {
  calculateReadTime,
  capitalizeFirstLetter,
  formatDate,
} from "@/app/configs/constants";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Demo_Image } from "../assets/demo";
import CategoryButton from "./CategoryButton";
import Error from "./Error";
import Loading from "./Loading";
import LottiSection from "./LottiSection";

export default function HeroSection() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts from the server
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: 1,
          limit: 5,
          sort: "createdAt",
          order: "desc",
          catagory: "Trending",
        };

        const response = await axiosInstance.get("/posts", { params });

        setPosts(response.data.data.posts || []);
      } catch (err) {
        console.error(
          "Error fetching hero posts:",
          err.response?.data || err.message
        );
        setError(err.response?.data?.message || "Failed to load posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error errMessage={error} />;
  }

  return (
    <>
      {user ? (
        <div className="relative w-full h-[550px] mb-12">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            className="w-full h-full"
          >
            {posts.map((post) => (
              <SwiperSlide key={post._id}>
                <div className="relative w-full h-full">
                  <Image
                    src={post.image || Demo_Image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-24 left-8 z-10">
                    <CategoryButton category="Trending" active={true} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8 text-white">
                    <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
                    {post.content && (
                      <p className="text-gray-300 mb-4 max-w-2xl">
                        {post.content.slice(0, 200) +
                          (post.content.length > 200 ? "..." : "")}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      {post.createdAt && (
                        <div className="flex items-center gap-2 text-gray-400">
                          {formatDate(post.createdAt)} ·{" "}
                          {calculateReadTime(post.content)}
                        </div>
                      )}
                      <Link
                        href={`/posts/${post._id}`}
                        className="bg-white text-black hover:bg-primary hover:text-white px-4 py-2 rounded-md text-sm"
                      >
                        Read now
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image
                        src={post.author?.avatar || Demo_Image}
                        alt={post.author?.userName || "Unknown"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <Link
                        href={`/users/${post.author?.userName || ""}`}
                        className="hover:text-primary"
                      >
                        <span>
                          {capitalizeFirstLetter(
                            post.author?.userName || "Unknown"
                          )}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <LottiSection />
      )}
    </>
  );
}
