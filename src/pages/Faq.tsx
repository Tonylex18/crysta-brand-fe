const faqs = [
  {
    question: "How do I place an order?",
    answer:
      "Browse products, choose your preferred size and color where available, add the item to your cart, then complete checkout with your delivery details and payment.",
  },
  {
    question: "Can I track my order status after payment?",
    answer:
      "Yes. After checkout, your order status is stored in your account and can be reviewed from your dashboard as it moves from processing to delivery.",
  },
  {
    question: "Do you deliver nationwide?",
    answer:
      "Delivery pricing is calculated from your selected state during checkout. If your location is supported, the available delivery option and fee will be shown before payment.",
  },
  {
    question: "Can I change my order after paying?",
    answer:
      "Contact support as soon as possible with your payment reference. Changes depend on whether the order has already entered processing or shipment.",
  },
  {
    question: "What happens if an item has multiple sizes or colors?",
    answer:
      "Your chosen item specification is captured with the order so the fulfilment team can see the selected size, color, quantity, and other item details before processing.",
  },
  {
    question: "How do refunds or cancellations work?",
    answer:
      "Cancelled orders and refunds are handled based on payment and fulfilment status. Reach support quickly with your order details so the team can confirm eligibility and next steps.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf4_0%,#ffffff_36%)]">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[30px] bg-[#12108b] p-8 text-white shadow-[0_28px_90px_-48px_rgba(18,16,139,0.68)]">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">FAQ</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              Straight answers for shopping, checkout, delivery, and support.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
              This page covers the common questions customers ask before ordering and after payment, with practical answers that reduce friction.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item, index) => (
              <article
                key={item.question}
                className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f3ff] text-sm font-semibold text-[#12108b]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{item.question}</h2>
                    <p className="mt-3 text-sm leading-7 text-gray-600">{item.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
