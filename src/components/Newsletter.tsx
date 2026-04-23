import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { newsletterAPI } from "../pages/lib/api";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address to subscribe");
      return;
    }

    try {
      setSubmitting(true);
      const response = await newsletterAPI.subscribe(email.trim());
      toast.success(response.message || "Subscribed successfully");
      setEmail("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to subscribe");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-[#0a0a18] py-12 flex flex-col md:flex-row items-center justify-between px-6 md:px-16">
      <div className="flex-1 flex flex-col items-start md:items-start mb-6 md:mb-0">
        <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">
          Sign Up For Newsletters
        </h2>
        <p className="text-gray-300 text-lg md:text-xl font-medium">
          Get E-mail updates about our latest shop and{' '}
          <span className="text-yellow-400 font-semibold">special offers</span>.
        </p>
      </div>
      <form
        className="flex items-center w-full md:w-auto max-w-md"
        onSubmit={handleSubmit}
      >
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full md:w-[300px] px-4 py-3 rounded-l-full bg-white text-gray-800 text-base outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 bg-green-900 text-white font-semibold rounded-r-full hover:bg-green-800 transition"
        >
          {submitting ? "Submitting..." : "Sign Up"}
        </button>
      </form>
    </section>
  );
};

export default Newsletter;
