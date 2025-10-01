"use client";

import lottieJSON from "@/app/assets/lottieFiles/lottie.json";
import dynamic from "next/dynamic";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function LottiSection() {
  return (
    <>
      <div className="relative w-full h-[80vh] mb-12">
        <div className="max-w-[1200px] mx-auto px-3 h-full w-full flex md:flex-row flex-col items-center">
          <div className="flex-1 flex flex-col h-full md:items-start md:justify-center items-center p-5 md:p-0 gap-5">
            <h1 className="text-center md:text-left xl:text-6xl md:text-5xl text-4xl font-bold md:max-w-[700px] max-w-[500px] dark:text-white">
              Discover blogs, share and explore the world with people
            </h1>
            <p className="font-semibold bg-gray-700 dark:bg-gray-100 hover:bg-primary hover:text-white text-white dark:text-black px-3 py-2 rounded-md">
              <Link href="/signup">Join our community</Link>
            </p>
          </div>
          <div className=" dark:bg-[#999696] xl:w-[400px] md:w-[350px] w-[250px] rounded-md h-[300px] md:ml-auto">
            <Lottie
              animationData={lottieJSON}
              loop={true}
              autoplay={true}
              style={{ width: "100%", height: "100%", marginLeft: "auto" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
