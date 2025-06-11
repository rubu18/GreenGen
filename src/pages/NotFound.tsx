
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-eco mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Oops! Page not found</p>
        <p className="text-gray-500 mb-8 max-w-md text-center">
          The page you are looking for might have been removed or is temporarily unavailable.
        </p>
        <Button className="bg-eco hover:bg-eco-dark">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;
