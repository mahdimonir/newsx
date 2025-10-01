function Error({ errMessage }) {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-50 dark:bg-gray-900">
      <h3 className="text-gray-800 dark:text-gray-100 text-xl font-semibold">
        {errMessage || "Something went wrong. Please try again later."}
      </h3>
    </div>
  );
}

export default Error;
