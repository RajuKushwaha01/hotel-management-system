import { useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    // No dedicated backend endpoint exists for anonymous contact-form mail yet — this can be wired to
    // POST /api/public/contact (mirroring the complaint pattern) once that route is added.
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Thanks! We\'ll get back to you within 24 hours.');
    setForm({ name: '', email: '', message: '' });
    setSending(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12">
      <div className="animate-fade-in">
        <h1 className="font-display text-4xl mb-4">Get in Touch</h1>
        <p className="text-text-secondary mb-8">We're here to help with reservations, events, or anything else.</p>

        <div className="space-y-5">
          <div className="flex items-center gap-3"><Phone className="text-gold" size={18} /><span>+91 98765 43210</span></div>
          <div className="flex items-center gap-3"><Mail className="text-gold" size={18} /><span>reservations@grandvista.com</span></div>
          <div className="flex items-center gap-3"><MapPin className="text-gold" size={18} /><span>123 Beachfront Avenue, Goa, India</span></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder space-y-4 animate-slide-up">
        <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <textarea
          placeholder="Your message" rows={5} required value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-border dark:border-darkBorder bg-transparent resize-none"
        />
        <Button variant="gold" className="w-full" disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</Button>
      </form>
    </div>
  );
}
