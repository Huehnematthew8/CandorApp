'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';
import type { Contact } from '@/types';

interface ContactsSectionProps {
  jobId: string;
  contacts: Contact[];
}

function EmailIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.34a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.08 6.08l1.02-.97a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

const inputBase: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--b1)',
  color: 'var(--t1)',
  fontSize: '11px',
  outline: 'none',
  padding: '4px 0',
  width: '100%',
  transition: 'border-color 0.15s ease',
};

/* ── Inline edit row for an existing contact ── */
function ContactEditForm({
  jobId,
  contact,
  hasEmailPhone,
  onDone,
}: {
  jobId: string;
  contact: Contact;
  hasEmailPhone: boolean;
  onDone: () => void;
}) {
  const { updateContact, deleteContact } = useAppStore();
  const { toast } = useToast();
  const [name, setName] = useState(contact.name);
  const [role, setRole] = useState(contact.role || '');
  const [email, setEmail] = useState(contact.email || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return;
    const ok = await updateContact(jobId, contact.id, {
      name: name.trim(),
      role: role.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
    });
    if (ok) {
      toast('Contact updated');
      onDone();
    } else {
      toast('Failed to update contact');
    }
  }

  async function handleDelete() {
    const ok = await deleteContact(jobId, contact.id);
    if (ok) {
      toast('Contact removed');
      onDone();
    } else {
      toast('Failed to remove contact');
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '10px',
      borderRadius: '8px',
      background: 'var(--s2)',
      border: '1px solid var(--b1)',
      animation: 'up .15s ease both',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: '2px' }}>Name *</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            autoFocus
            style={{ ...inputBase, borderBottomColor: focused === 'name' ? 'var(--gold)' : 'var(--b1)' }}
          />
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: '2px' }}>Role</div>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onFocus={() => setFocused('role')}
            onBlur={() => setFocused(null)}
            placeholder="e.g. Recruiter"
            style={{ ...inputBase, borderBottomColor: focused === 'role' ? 'var(--gold)' : 'var(--b1)' }}
          />
        </div>
      </div>
      {hasEmailPhone && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: '2px' }}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="name@company.com"
              type="email"
              style={{ ...inputBase, borderBottomColor: focused === 'email' ? 'var(--gold)' : 'var(--b1)' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: '2px' }}>Phone</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              placeholder="+1 555 000 0000"
              type="tel"
              style={{ ...inputBase, borderBottomColor: focused === 'phone' ? 'var(--gold)' : 'var(--b1)' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          style={{
            padding: '5px 12px',
            borderRadius: '100px',
            background: name.trim() ? 'var(--gold)' : 'var(--b2)',
            color: name.trim() ? '#ffffff' : 'var(--t3)',
            border: 'none',
            fontSize: '10px',
            fontWeight: 600,
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
        >
          Save
        </button>
        <button
          onClick={onDone}
          style={{ fontSize: '10px', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          style={{ fontSize: '10px', color: 'var(--red, #e05c5c)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function ContactsSection({ jobId, contacts }: ContactsSectionProps) {
  const { addContact, contactsHaveEmailPhone } = useAppStore();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // After first attempt we know if schema supports email/phone
  const hasEmailPhone = contactsHaveEmailPhone !== false;

  async function handleAdd() {
    if (!name.trim() || saving) return;
    setSaving(true);
    const result = await addContact(jobId, {
      name: name.trim(),
      role: role.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
    });
    setSaving(false);

    if (result.ok) {
      setName(''); setRole(''); setEmail(''); setPhone('');
      setAdding(false);
      if (result.missingSchema) {
        toast('Contact added (run schema migration to enable email & phone)');
      } else {
        toast('Contact added');
      }
    } else {
      toast('Failed to add contact — check console for details');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)' }}>
          Contacts
        </div>
        <button
          onClick={() => { setAdding(!adding); setEditingId(null); }}
          style={{ fontSize: '9px', fontWeight: 700, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Schema migration notice */}
      {contactsHaveEmailPhone === false && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '7px',
          background: 'var(--ad)',
          border: '1px solid rgba(230,126,34,0.2)',
          fontSize: '10px',
          color: 'var(--amber)',
          lineHeight: 1.5,
        }}>
          <strong>Schema update needed</strong> — run this in your{' '}
          <a
            href="https://supabase.com/dashboard/project/_/sql"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Supabase SQL Editor
          </a>
          :
          <code style={{
            display: 'block',
            marginTop: '5px',
            padding: '5px 7px',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.06)',
            fontSize: '9px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            color: 'var(--t1)',
          }}>
            {`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT;\nALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;`}
          </code>
        </div>
      )}

      {adding && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '10px',
          borderRadius: '8px',
          background: 'var(--s2)',
          border: '1px solid var(--b1)',
          animation: 'up .15s ease both',
        }}>
          {/* Row 1: Name + Role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: '2px' }}>Name *</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Full name"
                autoFocus
                style={{ ...inputBase, borderBottomColor: focusedField === 'name' ? 'var(--gold)' : 'var(--b1)' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: '2px' }}>Role</div>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onFocus={() => setFocusedField('role')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Recruiter"
                style={{ ...inputBase, borderBottomColor: focusedField === 'role' ? 'var(--gold)' : 'var(--b1)' }}
              />
            </div>
          </div>

          {/* Row 2: Email + Phone (only if schema supports it) */}
          {hasEmailPhone && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: '2px' }}>Email</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@company.com"
                  type="email"
                  style={{ ...inputBase, borderBottomColor: focusedField === 'email' ? 'var(--gold)' : 'var(--b1)' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: '2px' }}>Phone</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="+1 555 000 0000"
                  type="tel"
                  style={{ ...inputBase, borderBottomColor: focusedField === 'phone' ? 'var(--gold)' : 'var(--b1)' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!name.trim() || saving}
            style={{
              marginTop: '2px',
              padding: '5px 12px',
              borderRadius: '100px',
              background: name.trim() && !saving ? 'var(--gold)' : 'var(--b2)',
              color: name.trim() && !saving ? '#ffffff' : 'var(--t3)',
              border: 'none',
              fontSize: '10px',
              fontWeight: 600,
              cursor: name.trim() && !saving ? 'pointer' : 'not-allowed',
              alignSelf: 'flex-start',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {saving && <span style={{ width: '9px', height: '9px', border: '1.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />}
            {saving ? 'Saving…' : 'Save contact'}
          </button>
        </div>
      )}

      {contacts.map((c) =>
        editingId === c.id ? (
          <ContactEditForm
            key={c.id}
            jobId={jobId}
            contact={c}
            hasEmailPhone={hasEmailPhone}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'var(--s1)',
              border: '1px solid var(--b1)',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--glow)',
              border: '1px solid rgba(94,92,230,.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 700,
              color: 'var(--gold)',
              flexShrink: 0,
              marginTop: '1px',
            }}>
              {c.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t1)', marginBottom: '1px' }}>{c.name}</div>
              {c.role && (
                <div style={{ fontSize: '10px', color: 'var(--t3)', marginBottom: '3px' }}>{c.role}</div>
              )}
              {(c.email || c.phone) ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '3px' }}>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--gold)', textDecoration: 'none' }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      <EmailIcon />
                      {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--t2)', textDecoration: 'none' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t2)'; }}
                    >
                      <PhoneIcon />
                      {c.phone}
                    </a>
                  )}
                </div>
              ) : hasEmailPhone && (
                <button
                  onClick={() => { setEditingId(c.id); setAdding(false); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px', fontSize: '10px', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; }}
                >
                  + Add email / phone
                </button>
              )}
            </div>

            {/* Edit button */}
            <button
              onClick={() => { setEditingId(c.id); setAdding(false); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'none', border: '1px solid transparent', color: 'var(--t3)', cursor: 'pointer', flexShrink: 0, transition: 'all .14s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--s2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'none'; }}
              title="Edit contact"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        )
      )}

      {contacts.length === 0 && !adding && (
        <div style={{ fontSize: '11px', color: 'var(--t3)', textAlign: 'center', padding: '10px' }}>
          No contacts yet
        </div>
      )}
    </div>
  );
}
