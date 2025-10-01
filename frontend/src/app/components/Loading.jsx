import HashLoader from "react-spinners/HashLoader";

function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-50 dark:bg-gray-900">
      <HashLoader color="#6200ee" />
    </div>
  );
}

export default Loading;
