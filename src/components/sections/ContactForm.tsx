"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { contact } from "@/lib/content";

type Fields = {
  name: string;
  email: string;
  subject: string;
  phone: string;
  message: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

/**
 * Contact form.
 *
 * The redesigned site ships without a backend, so rather than a form that
 * silently fails on submit, this composes a prefilled email to 160K's
 * published support address. WhatsApp is offered alongside it as the
 * faster channel, matching how the current site handles enquiries.
 *
 * Validation is explicit rather than left to the browser: `required` alone
 * blocks submission without ever saying why, and a message that only appears
 * after a failed send is a message nobody reads. Errors are announced through
 * `aria-invalid` + `aria-describedby` and are cleared as each field is fixed,
 * so the form never traps someone in a red state.
 */

const EMPTY: Fields = { name: "", email: "", subject: "", phone: "", message: "" };

/* Deliberately permissive: the only job is to catch a typo, not to adjudicate
   RFC 5322. Rejecting a valid address costs more than accepting a bad one. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Fields): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Tell us who you are so we know who to reply to.";
  if (!v.email.trim()) e.email = "We need an email address to reply to.";
  else if (!EMAIL.test(v.email.trim())) e.email = "That address looks incomplete — check for a typo.";
  if (!v.message.trim()) e.message = "Add a short message so we know what you need.";
  else if (v.message.trim().length < 10) e.message = "A little more detail will get you a better answer.";
  if (v.phone.trim() && !/^[\d\s+()-]{7,}$/.test(v.phone.trim()))
    e.phone = "Use digits, spaces and + ( ) only.";
  return e;
}

export function ContactForm() {
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const uid = useId();

  function read(form: HTMLFormElement): Fields {
    const f = new FormData(form);
    return {
      name: String(f.get("name") ?? "").trim(),
      email: String(f.get("email") ?? "").trim(),
      subject: String(f.get("subject") ?? "").trim(),
      phone: String(f.get("phone") ?? "").trim(),
      message: String(f.get("message") ?? "").trim(),
    };
  }

  /* Re-validate a single field on blur: cheaper than validating the whole form
     while someone is still halfway through typing their name. */
  function onBlur(e: React.FocusEvent<HTMLFormElement>) {
    const name = e.target.name as keyof Fields | null;
    if (!name) return;
    const next = validate(read(e.currentTarget));
    setErrors((prev) => ({ ...prev, [name]: next[name] }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = read(form);
    const next = validate(v);
    setErrors(next);

    const firstBad = (Object.keys(v) as (keyof Fields)[]).find((k) => next[k]);
    if (firstBad) {
      setSent(false);
      form.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }

    const subject = v.subject || "Website enquiry";
    const body = [`Name: ${v.name}`, `Email: ${v.email}`, v.phone ? `Phone: ${v.phone}` : null, "", v.message]
      .filter((l): l is string => l !== null)
      .join("\n");

    window.location.href =
      `mailto:${contact.email}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    setValues(EMPTY);
    setSent(true);
  }

  const field =
    "w-full rounded-[2px] border bg-abyss/60 px-3.5 py-3 text-[0.9375rem] text-ink " +
    "placeholder:text-faint transition-colors duration-200 focus:bg-abyss focus:outline-none";

  /* One field renderer so label, control, error and aria wiring cannot drift
     apart between the five inputs. */
  function renderField({
    name,
    label,
    type = "text",
    autoComplete,
    placeholder,
    optional,
    multiline,
  }: {
    name: keyof Fields;
    label: string;
    type?: string;
    autoComplete?: string;
    placeholder?: string;
    optional?: string;
    multiline?: boolean;
  }) {
    const id = `${uid}-${name}`;
    const errId = `${id}-error`;
    const error = errors[name];
    const common = {
      id,
      name,
      value: values[name],
      placeholder,
      ...(autoComplete ? { autoComplete } : {}),
      ...(multiline ? {} : { type }),
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? errId : undefined,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        const v = e.target.value;
        setValues((prev) => ({ ...prev, [name]: v }));
        // Clear the error the moment the field becomes valid, so the form
        // never nags someone who has already fixed the problem.
        if (errors[name]) {
          const next = validate({ ...values, [name]: v });
          if (!next[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
      },
      className: `${field} ${error ? "border-danger" : "border-line focus:border-infra"}`,
    };

    return (
      <div>
        <label htmlFor={id} className="mb-2 block text-sm text-ink-dim">
          {label} {optional ? <span className="text-faint">({optional})</span> : null}
        </label>
        {multiline ? (
          <textarea {...common} rows={5} className={`${common.className} resize-y`} />
        ) : (
          <input {...common} />
        )}
        {error ? (
          <p id={errId} role="alert" className="mt-2 text-xs leading-relaxed text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onBlur={onBlur}
      noValidate
      aria-labelledby={`${uid}-legend`}
      className="rounded-[var(--radius-panel)] border border-line bg-surface p-6 md:p-8"
    >
      <p id={`${uid}-legend`} className="sr-only">
        Contact 160K. Your name, email and message are required; subject and
        phone are optional.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {renderField({ name: "name", label: "Your name", autoComplete: "name", placeholder: "Sari Wijaya" })}
        {renderField({
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@company.com",
        })}
        {renderField({
          name: "subject",
          label: "Subject",
          placeholder: "A2P messaging for our platform",
          optional: "optional",
        })}
        {renderField({
          name: "phone",
          label: "Phone",
          type: "tel",
          autoComplete: "tel",
          placeholder: "+62 812 0000 0000",
          optional: "optional",
        })}
      </div>

      <div className="mt-5">
        {renderField({
          name: "message",
          label: "Message",
          multiline: true,
          placeholder: "Tell us what you need to reach customers through.",
        })}
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
