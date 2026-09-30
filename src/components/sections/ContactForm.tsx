"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { contact } from "@/lib/content";

/**
 * Contact form.
 *
 * The redesigned site ships without a backend, so rather than a form that
 * silently fails on submit, this composes a prefilled email to 160K's
 * published support address. WhatsApp is offered alongside it as the
 * faster channel, matching how the current site handles enquiries.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const subject = String(f.get("subject") ?? "").trim() || "Website enquiry";
    const phone = String(f.get("phone") ?? "").trim();
    const message = String(f.get("message") ?? "").trim();

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      "",
      message,
    ]
      .filter((l) => l !== null)
      .join("\n");

    window.location.href =
      `mailto:${contact.email}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    setSent(true);
  }

  const field =
    "w-full rounded-[2px] border border-line bg-abyss/60 px-3.5 py-3 text-[0.9375rem] text-ink " +
    "placeholder:text-faint transition-colors duration-200 focus:border-infra focus:bg-abyss focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="rounded-[var(--radius-panel)] border border-line bg-surface p-6 md:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-ink-dim">
            Your name
          </label>
          <input id="name" name="name" required autoComplete="name" className={field} placeholder="Sari Wijaya" />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-ink-dim">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="subject" className="mb-2 block text-sm text-ink-dim">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            className={field}
            placeholder="A2P messaging for our platform"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-2 block text-sm text-ink-dim">
            Phone <span className="text-faint">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={field}
            placeholder="+62 812 0000 0000"
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="mb-2 block text-sm text-ink-dim">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={`${field} resize-y`}
          placeholder="Tell us what you need to reach customers through."
        />
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg">
          Send message
        </Button>
        <p aria-live="polite" className="text-xs leading-relaxed text-faint">
          {sent
            ? "Your email client should now be open with the message ready to send."
            : "Opens a prefilled email to our support address."}
        </p>
      </div>
    </form>
  );
}
