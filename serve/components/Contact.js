'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { useReveal } from './useReveal'
import { getApiBase } from '@/lib/public-url'

const INTEREST_OPTIONS = [
  'Full SERVE setup',
  'Just a demo first',
  'QR ordering add-on',
  'Inventory management',
  'Staff & roles setup',
  'General inquiry',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function isValidNepalPhone(value) {
  const digits = normalizePhoneDigits(value)
  if (digits.startsWith('977') && digits.length === 13) {
    return /^9779[6-8]\d{8}$/.test(digits)
  }
  if (digits.length === 10) {
    return /^9[6-8]\d{8}$/.test(digits)
  }
  return false
}

function validateForm({ full_name, cafe_name, phone, email, interest, message }) {
  const errors = {}

  if (!full_name) errors.full_name = 'Your name is required.'
  else if (full_name.length < 2) errors.full_name = 'Enter at least 2 characters.'

  if (!cafe_name) errors.cafe_name = 'Cafe name is required.'
  else if (cafe_name.length < 2) errors.cafe_name = 'Enter at least 2 characters.'

  if (!phone) errors.phone = 'Phone number is required.'
  else if (!isValidNepalPhone(phone)) {
    errors.phone = 'Enter a valid Nepal mobile number (e.g. 98XXXXXXXX or +977 98XXXXXXXX).'
  }

  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!interest) errors.interest = 'Please select what you are interested in.'

  if (message && message.length < 10) {
    errors.message = 'Please share a bit more (at least 10 characters).'
  }

  return errors
}

const WaIcon = () => (
  <svg className="w-5 h-5 fill-white flex-shrink-0" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const Chevron = ({ open }) => (
  <svg
    className={`h-4 w-4 shrink-0 text-caramel transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden
  >
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} className="text-[0.78rem] text-red-600 font-medium">
      {message}
    </p>
  )
}

function InterestSelect({ name, className, value, onChange, error, onBlur }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const rootRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false)
        onBlur?.()
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onBlur])

  const selectOption = (option) => {
    onChange(option)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={Boolean(error)}
        onClick={() => setOpen((v) => !v)}
        className={`${className} flex items-center justify-between gap-3 text-left cursor-pointer
          ${open ? 'border-accent bg-white shadow-[0_0_0_3px_rgba(232,135,58,0.12)]' : ''}
          ${error ? 'border-red-400' : ''}
          ${value ? 'text-ink' : 'text-muted'}`}
      >
        <span className="truncate">{value || 'Select an option'}</span>
        <Chevron open={open} />
      </button>

      <div
        className={`absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 origin-top
          transition-all ease-[cubic-bezier(0.22,1,0.36,1)]
          ${open ? 'pointer-events-auto' : 'pointer-events-none'}
          ${visible ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1.5 scale-[0.97] opacity-0'}`}
        style={{ transitionDuration: '220ms' }}
      >
        <ul
          id={listId}
          role="listbox"
          className="overflow-hidden rounded-xl border border-caramel/20 bg-white
            shadow-[0_12px_40px_rgba(26,15,10,0.12)] py-1.5"
        >
          {INTEREST_OPTIONS.map((option) => {
            const selected = value === option
            return (
              <li key={option} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => selectOption(option)}
                  className={`flex w-full items-center px-4 py-2.5 text-left font-dm text-[0.92rem]
                    transition-colors duration-150 cursor-pointer
                    ${selected
                      ? 'bg-accent/10 text-espresso font-medium'
                      : 'text-ink hover:bg-cream hover:text-espresso'}`}
                >
                  {option}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

const emptyForm = {
  full_name: '',
  cafe_name: '',
  phone: '',
  email: '',
  message: '',
}

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [interest, setInterest] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
  const ref = useReveal()

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (touched[key] || fieldErrors[key]) {
      const next = validateForm({ ...form, [key]: value, interest })
      setFieldErrors((prev) => ({ ...prev, [key]: next[key] || '' }))
    }
  }

  const markTouched = (key) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    const next = validateForm({ ...form, interest })
    setFieldErrors((prev) => ({ ...prev, [key]: next[key] || '' }))
  }

  const handleInterestChange = (value) => {
    setInterest(value)
    setTouched((prev) => ({ ...prev, interest: true }))
    const next = validateForm({ ...form, interest: value })
    setFieldErrors((prev) => ({ ...prev, interest: next.interest || '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      full_name: form.full_name.trim(),
      cafe_name: form.cafe_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      interest,
      message: form.message.trim(),
    }
    const errors = validateForm(payload)
    setTouched({
      full_name: true,
      cafe_name: true,
      phone: true,
      email: true,
      interest: true,
      message: true,
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      setError('')
      return
    }

    setLoading(true)
    setError('')
    setSent(false)

    try {
      const res = await fetch(`${getApiBase(process.env.NEXT_PUBLIC_API_BASE_URL)}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: payload.full_name,
          cafe_name: payload.cafe_name,
          phone: payload.phone,
          email: payload.email || undefined,
          subject: payload.interest,
          message: payload.message || 'No additional details provided.',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.success === false) {
        const apiMsg =
          (typeof json.data === 'object' && json.data && Object.values(json.data)[0]) ||
          json.msg ||
          json.message ||
          'Could not send message.'
        throw new Error(typeof apiMsg === 'string' ? apiMsg : 'Could not send message.')
      }
      setSent(true)
      setForm(emptyForm)
      setInterest('')
      setFieldErrors({})
      setTouched({})
      setTimeout(() => setSent(false), 5000)
    } catch (err) {
      setError(err.message || 'Could not send message.')
    } finally {
      setLoading(false)
    }
  }

  const input = `w-full bg-milk border border-caramel/15 rounded-xl px-4 py-3
    font-dm text-[0.92rem] text-ink outline-none transition-all duration-200
    focus:border-accent focus:bg-white focus:shadow-[0_0_0_3px_rgba(232,135,58,0.12)]`
  const errBorder = 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.18)]'

  return (
    <section id="contact" ref={ref} className="relative overflow-hidden bg-cream py-28">
      <div className="pointer-events-none absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(232,135,58,0.07), transparent 70%)', transform: 'translate(30%, 30%)' }} />

      <div className="site-wrap relative">
      <div data-reveal>
        <div className="section-label">Get In Touch</div>
        <h2 className="section-headline">Let&apos;s get your cafe<br />running on SERVE</h2>
        <p className="section-sub">Book a free demo or just reach out. No sales pressure — just a real conversation about your cafe.</p>
        <div className="section-rule" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mt-16">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" data-reveal="left">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.82rem] font-medium text-coffee">Your Name</label>
              <input
                name="full_name"
                type="text"
                placeholder="Suman Rai"
                autoComplete="name"
                value={form.full_name}
                onChange={(e) => setField('full_name', e.target.value)}
                onBlur={() => markTouched('full_name')}
                aria-invalid={Boolean(fieldErrors.full_name)}
                className={`${input} ${fieldErrors.full_name ? errBorder : ''}`}
              />
              <FieldError id="err-full_name" message={fieldErrors.full_name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.82rem] font-medium text-coffee">Cafe Name</label>
              <input
                name="cafe_name"
                type="text"
                placeholder="The Coffee Nest"
                value={form.cafe_name}
                onChange={(e) => setField('cafe_name', e.target.value)}
                onBlur={() => markTouched('cafe_name')}
                aria-invalid={Boolean(fieldErrors.cafe_name)}
                className={`${input} ${fieldErrors.cafe_name ? errBorder : ''}`}
              />
              <FieldError id="err-cafe_name" message={fieldErrors.cafe_name} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.82rem] font-medium text-coffee">Phone / WhatsApp</label>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+977 98XXXXXXXX"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value.replace(/[^\d+\s()-]/g, ''))}
                onBlur={() => markTouched('phone')}
                aria-invalid={Boolean(fieldErrors.phone)}
                className={`${input} ${fieldErrors.phone ? errBorder : ''}`}
              />
              <FieldError id="err-phone" message={fieldErrors.phone} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.82rem] font-medium text-coffee">Email (optional)</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@cafe.com"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                onBlur={() => markTouched('email')}
                aria-invalid={Boolean(fieldErrors.email)}
                className={`${input} ${fieldErrors.email ? errBorder : ''}`}
              />
              <FieldError id="err-email" message={fieldErrors.email} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-medium text-coffee">What are you interested in?</label>
            <InterestSelect
              name="interest"
              className={input}
              value={interest}
              onChange={handleInterestChange}
              onBlur={() => markTouched('interest')}
              error={fieldErrors.interest}
            />
            <FieldError id="err-interest" message={fieldErrors.interest} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-medium text-coffee">Tell us about your cafe</label>
            <textarea
              name="message"
              rows={4}
              placeholder="How many tables? Current system? Biggest challenge?"
              value={form.message}
              onChange={(e) => setField('message', e.target.value)}
              onBlur={() => markTouched('message')}
              aria-invalid={Boolean(fieldErrors.message)}
              className={`${input} resize-y min-h-[120px] ${fieldErrors.message ? errBorder : ''}`}
            />
            <FieldError id="err-message" message={fieldErrors.message} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-[0.88em] rounded-full bg-espresso text-cream text-base font-medium
              transition-all duration-300 border-none cursor-pointer
              hover:bg-coffee hover:-translate-y-[2px] hover:shadow-[0_10px_32px_rgba(26,15,10,0.28)]
              disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0">
            {loading ? 'Sending...' : 'Send Message →'}
          </button>
          {sent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-[0.9rem] text-green-800 font-medium">
              Message sent! We&apos;ll reach out within 24 hours.
            </div>
          )}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-[0.9rem] text-red-800 font-medium">
              {error}
            </div>
          ) : null}
        </form>

        <div className="flex flex-col gap-8" data-reveal="right" data-delay="2">
          <h3 className="font-syne text-[1.25rem] font-bold text-ink">Prefer to reach us directly?</h3>
          {[
            { icon:'📱', label:'WhatsApp / Phone', value:'+977 9869028924' },
            { icon:'✉️', label:'Email',            value:'serve@technirvana.com.np' },
            { icon:'🕘', label:'Support Hours',    value:'9 AM – 6 PM, 7 days a week' },
          ].map(d => (
            <div key={d.label} className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(196,118,58,0.1)' }}>{d.icon}</div>
              <div>
                <div className="text-[0.82rem] font-medium text-muted mb-[2px]">{d.label}</div>
                <div className="text-[0.95rem] text-ink font-medium">{d.value}</div>
              </div>
            </div>
          ))}
          <a href="https://wa.me/9779869028924?text=Hi%2C%20I'd%20like%20to%20book%20a%20demo%20for%20SERVE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-[0.88em] rounded-full bg-[#25D366] text-white
              text-base font-medium no-underline transition-all duration-300
              hover:bg-[#1fba59] hover:-translate-y-[2px] hover:shadow-[0_10px_32px_rgba(37,211,102,0.4)]">
            <WaIcon /> Book a Demo on WhatsApp
          </a>
          <div className="bg-steam rounded-[20px] p-6 border border-caramel/10">
            <p className="text-[0.82rem] text-muted leading-relaxed font-light">
              <strong className="text-espresso font-medium">Free demo:</strong> We&apos;ll walk through SERVE with your actual cafe layout in mind — no generic slides, no pressure.
            </p>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}
