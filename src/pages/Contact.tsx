import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Phone, MapPin, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface ContactProps {
  // Accepts the same user state object passed to your Profile page
  user: { id: string; email: string } | null;
}

export default function Contact({ user }: ContactProps) {
  const [isTransmitted, setIsTransmitted] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Dynamic form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Pull profile name settings from public.profiles whenever user context changes
  useEffect(() => {
    async function syncProfileData() {
      if (!user?.id) {
        // Fallback or clear form values if logged out
        setFormData(prev => ({ ...prev, name: '', email: '' }));
        return;
      }

      try {
        setIsLoadingProfile(true);
        
        // Match the database table syntax from your user profile page
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        const resolvedFirstName = profileData?.first_name || '';
        const resolvedLastName = profileData?.last_name || '';
        const assembledFullName = `${resolvedFirstName} ${resolvedLastName}`.trim();

        setFormData(prev => ({
          ...prev,
          name: assembledFullName,
          email: user.email || '' // Seed directly from auth database object
        }));
      } catch (err) {
        console.error("Error setting customer credentials for workspace form layout:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    syncProfileData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMessageDispatch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Your contact form transmission/API dispatch logic goes here
    setIsTransmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-950 select-none animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-8 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* LEFT CONCIERGE INFORMATION SIDEBAR */}
          <div className="lg:col-span-5 space-y-12 lg:sticky lg:top-32">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={14} strokeWidth={1} className="text-[#c5a880]" />
                <span className="text-[11px] font-sans tracking-[0.25em] uppercase text-[#c5a880] font-semibold">
                  Atelier Assistance
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl tracking-wide uppercase font-light leading-none text-stone-950">
                Connect With Us.
              </h1>
              <p className="font-sans text-xs md:text-sm leading-relaxed text-stone-500 font-light tracking-wide">
                For immediate order tracking, tailored corporate gifting allocations, or customized sizing guidance, consult our concierge response network.
              </p>
            </div>

            <div className="space-y-6 font-sans text-xs font-light tracking-wide text-stone-600">
              <div className="flex items-start gap-4">
                <Mail size={16} className="text-[#c5a880] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] tracking-[0.2em] text-stone-400 uppercase block font-semibold">Digital Mailbox</span>
                  <a href="mailto:concierge@yourbrand.com" className="hover:text-[#c5a880] transition-colors text-stone-950">concierge@yourbrand.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone size={16} className="text-[#c5a880] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] tracking-[0.2em] text-stone-400 uppercase block font-semibold">Direct Desk</span>
                  <a href="tel:+912200000000" className="hover:text-[#c5a880] transition-colors text-stone-950">+91 22 0000 0000</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin size={16} className="text-[#c5a880] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] tracking-[0.2em] text-stone-400 uppercase block font-semibold">Design Vault</span>
                  <p className="leading-relaxed text-stone-500">
                    Suite 5A, The Precious Enclave<br />
                    Bandra Arts Precinct, Mumbai, MH 400050
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT INTERACTIVE FORM CANVAS */}
          <div className="lg:col-span-7 bg-[#faf9f6] border border-stone-200 p-8 md:p-12 shadow-sm relative">
            {isLoadingProfile && (
              <div className="absolute inset-0 bg-[#faf9f6]/80 flex items-center justify-center z-10 animate-in fade-in duration-200">
                <Loader2 size={18} className="animate-spin text-[#c5a880]" />
              </div>
            )}

            {isTransmitted ? (
              <div className="py-20 text-center space-y-4 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl tracking-wide uppercase font-light text-[#c5a880]">Securely Dispatched</h3>
                <p className="font-sans text-xs text-stone-500 font-light max-w-xs mx-auto leading-relaxed">
                  Your inquiry message has passed registry authorization. An operational manager will correspond back within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMessageDispatch} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-semibold">Your Identity Name</label>
                    <input 
                      required 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!!user?.id && formData.name.length > 0} 
                      className={`w-full bg-transparent border-b border-stone-200 focus:border-[#c5a880] py-2 text-xs font-sans text-stone-900 outline-none transition-colors ${
                        user?.id && formData.name.length > 0 ? 'text-stone-400 cursor-not-allowed border-stone-100' : ''
                      }`} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-semibold">Email Address</label>
                    <input 
                      required 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!!user?.email} 
                      className={`w-full bg-transparent border-b border-stone-200 focus:border-[#c5a880] py-2 text-xs font-sans text-stone-900 outline-none transition-colors ${
                        user?.email ? 'text-stone-400 cursor-not-allowed border-stone-100' : ''
                      }`} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-semibold">Subject Intent</label>
                  <input 
                    required 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-stone-200 focus:border-[#c5a880] py-2 text-xs font-sans text-stone-900 outline-none transition-colors placeholder-stone-300" 
                    placeholder="Custom sizing adjustments, order modifications" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-sans tracking-[0.2em] uppercase text-stone-400 font-semibold">Inquiry Communication</label>
                  <textarea 
                    required 
                    rows={5} 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border border-stone-200 focus:border-[#c5a880] p-4 text-xs font-sans text-stone-900 outline-none transition-colors resize-none placeholder-stone-300 font-light leading-relaxed" 
                    placeholder="State your request details clearly here..." 
                  />
                </div>

                <button type="submit" className="group flex items-center gap-4 bg-stone-950 text-[#f5f2eb] px-8 py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-[#c5a880] hover:text-white transition-all duration-300 shadow-sm w-full justify-center cursor-pointer">
                  Request Assistance <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}