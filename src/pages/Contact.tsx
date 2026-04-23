import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { contactAPI } from "./lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const response = await contactAPI.sendMessage(form);
      toast.success(response.message || "Message sent successfully");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcff]">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] bg-[#12108b] p-8 text-white shadow-[0_28px_90px_-48px_rgba(18,16,139,0.65)]">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">Contact Us</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">Need support or want to reach the team?</h1>
            <p className="mt-5 text-base leading-7 text-white/80">
              Use the contact details below for order help, general enquiries, and partnership conversations.
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Phone</p>
                <p className="mt-2 text-lg font-medium">+44 7485705519</p>
                <p className="text-lg font-medium">07449688883</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Email</p>
                <p className="mt-2 text-lg font-medium">support@crysta.store</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Support Hours</p>
                <p className="mt-2 text-base text-white/85">Monday - Saturday, 9:00 AM to 6:00 PM</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Get in touch</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              This page is ready for your preferred contact workflow. For now it provides direct contact details and a placeholder form layout.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#12108b]/20"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#12108b]/20"
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#12108b]/20"
              />
              <textarea
                placeholder="Message"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="min-h-[180px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#12108b]/20"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#12108b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#211eb0]"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
