import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, MailCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AuthPageProps {
  onAuthSuccess: (email: string) => void;
  navigateToView: (
    targetPage: "collection" | "home" | "auth" | "profile" | "checkout" | "admin" | "product-details", 
    targetCategory?: string, targetProduct?: any, replace?: boolean) => void;
    initialMode?: AuthMode;
}

export type AuthMode = 'signin' | 'signup' | 'emailsent' | 'forgot' | 'resetpassword';

export default function AuthPage({ onAuthSuccess, navigateToView, initialMode }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode || 'signin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
   const [isProcessing, setIsProcessing] = useState(false);
  
  // Form input trackers
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string|null>(null);
  const clearFormState = () => {setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setErrorMessage(null);};

  // Catch inbound email recovery link clicks automatically
  useEffect(() => {
    const hasResetToken = 
      window.location.hash.includes('type=recovery') || 
      window.location.search.includes('type=recovery') ||
      window.location.hash.includes('access_token') ||
      window.location.search.includes('access_token');

    if (hasResetToken) {
      setMode('resetpassword');
      sessionStorage.removeItem('is_recovering_password');
    }
  }, []);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Validation Protocols
  const validateEmailFormat = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const validatePasswordStrength = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>_]/.test(pwd)) return "Password must contain at least one special character.";
    return null;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    // Common Email check for applicable fields
    if ((mode === 'signin' || mode === 'signup' || mode === 'forgot') && !validateEmailFormat(email)) {
      setErrorMessage("Please enter a valid structural email address.");
      return;
    }

    setIsProcessing(true);
    try {
      setLoading(true);

      if (mode === 'signup') {
        // Name validations (Must be greater than 3 characters long, i.e., <= 3 triggers error)
        if (firstName.trim().length < 3) {
          throw new Error("First name must be greater than 3 characters.");
        }
        if (lastName.trim().length < 3) {
          throw new Error("Last name must be greater than 3 characters.");
        }

        const passwordError = validatePasswordStrength(password);
        if (passwordError) throw new Error(passwordError);
        if (password !== confirmPassword) {
          throw new Error("Your password and confirmation password do not match.");
        }

        const combinedName = `${firstName.trim()} ${lastName.trim()}`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: combinedName,
              first_name: firstName.trim(),
              last_name: lastName.trim()
            },
            emailRedirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        setMode('emailsent');
      }

      else if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        setSuccessMessage(null);
        if (error) {
          if (error) {
            throw new Error("The email or password you entered is incorrect.");
          }
          return;
        }
        if (data.user) {
          onAuthSuccess(data.user.user_metadata?.full_name || data.user.email || email);
          navigateToView('home', undefined, null, true);
        }
      }

      else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMessage("If your email is registered, a password reset link has been sent to your inbox.");
      }

      else if (mode === 'resetpassword') {
        if (password !== confirmPassword) {
          throw new Error("Your new password and confirmation password do not match.");
        }
        const passwordError = validatePasswordStrength(password);
        if (passwordError) throw new Error(passwordError);

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        
        await supabase.auth.signOut();
        setMode('signin');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage("Password updated successfully. Please sign in with your new password.");
      }

    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center select-none">
      
      {/* LEFT IMAGE BLOCK */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-[65vh] bg-stone-950 p-12 relative overflow-hidden rounded-sm">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800" alt="Maison Details" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 text-[#f5f2eb] space-y-4">
          <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#c5a880]">Maison Registry</p>
          <h2 className="font-serif text-3xl uppercase tracking-widest font-light leading-snug">
            Save Your Personal <br />Allocation Preferences
          </h2>
          <p className="font-sans text-xs text-stone-400 font-light max-w-sm leading-relaxed tracking-wide">
            An active account securely retains your address mappings, layout configurations, and cart array states across all sessions.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-stone-500 text-[10px] tracking-wider uppercase font-sans">
          <ShieldCheck size={14} className="text-[#c5a880]" />
          Secure Encryption Active
        </div>
      </div>

      {/* RIGHT INPUT PANEL */}
      <div className="col-span-1 lg:col-span-6 max-w-md mx-auto w-full space-y-8">

        <AnimatePresence mode="wait">
          {mode === 'emailsent' ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center lg:text-left py-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-800 mx-auto lg:mx-0">
                <MailCheck size={20} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-2xl uppercase tracking-wider text-stone-900 font-light">Check your inbox</h3>
                <p className="font-sans text-xs text-stone-600 leading-relaxed">We sent a verification link to <strong className="text-stone-900 font-medium">{email}</strong>.</p>
                <p className="font-sans text-xs text-stone-400 leading-relaxed">Please click the link inside that email to confirm your account, then return here to sign in.</p>
              </div>
              <button onClick={() => { setMode('signin'); clearFormState(); }} className="text-xs font-sans text-stone-950 font-medium tracking-widest uppercase underline hover:text-[#c5a880] pt-2 cursor-pointer block">Go back to Sign In</button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl uppercase tracking-wider text-stone-900 font-light">
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Reset Password'}
                  {mode === 'resetpassword' && 'Choose New Password'}
                </h3>
                <p className="font-sans text-xs text-stone-500 mt-1 font-light">
                  {mode === 'signin' && 'Enter your login details to see your saved bags and wishlist.'}
                  {mode === 'signup' && 'Register your profile to get started.'}
                  {mode === 'forgot' && 'Enter your email address below, and we will email you a password reset link.'}
                  {mode === 'resetpassword' && 'Please type and confirm your brand new password below.'}
                </p>
              </div>

              {errorMessage && (
                <div className="p-4 text-xs font-sans font-light rounded-xs flex gap-3 leading-relaxed border bg-amber-50 border-amber-200/60 text-stone-800">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-stone-700" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-4 text-xs font-sans font-light rounded-xs flex gap-3 leading-relaxed border bg-green-50 border-green-200/60 text-green-800">
                  <MailCheck size={15} className="shrink-0 mt-0.5 text-green-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans tracking-widest uppercase text-stone-400 block">First Name</label>
                      <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Julian" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-4 py-3 text-xs tracking-wide font-sans font-light transition-colors rounded-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans tracking-widest uppercase text-stone-400 block">Last Name</label>
                      <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sterling" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-4 py-3 text-xs tracking-wide font-sans font-light transition-colors rounded-xs" />
                    </div>
                  </div>
                )}

                {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans tracking-widest uppercase text-stone-400 block">Email Address</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-4 py-3 text-xs tracking-wide font-sans font-light transition-colors rounded-xs" />
                  </div>
                )}

                {(mode === 'signin' || mode === 'signup' || mode === 'resetpassword') && (
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-sans tracking-widest uppercase text-stone-400 block">
                      {mode === 'resetpassword' ? 'New Password' : 'Password'}
                    </label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-4 py-3 pr-10 text-xs tracking-wide font-sans font-light transition-colors rounded-xs" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-950 p-1 cursor-pointer">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans tracking-widest uppercase text-stone-400 block">Confirm Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-4 py-3 text-xs tracking-wide font-sans font-light transition-colors rounded-xs" />
                  </div>
                )}

                {mode === 'resetpassword' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans tracking-widest uppercase text-stone-400 block">Confirm New Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-4 py-3 text-xs tracking-wide font-sans font-light transition-colors rounded-xs" />
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setMode('forgot'); clearFormState(); }} className="text-[10px] font-sans tracking-widest uppercase text-stone-400 hover:text-stone-950 underline cursor-pointer transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading || isProcessing} className="w-full group flex items-center justify-center gap-3 bg-stone-950 text-white py-4 text-[11px] tracking-[0.25em] uppercase hover:bg-[#c5a880] disabled:bg-stone-200 transition-colors duration-300 shadow-sm cursor-pointer mt-2">
                  {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Save New Password'}
                  {!loading && <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-stone-100 text-xs font-sans text-stone-500 font-light">
                {mode === 'signin' && (
                  <p>New to our seasonal portfolios? <button onClick={() => { setMode('signup'); clearFormState(); }} className="text-stone-950 font-normal underline ml-1 tracking-wide hover:text-[#c5a880] cursor-pointer transition-colors">Create an Account</button></p>
                )}
                {mode === 'signup' && (
                  <p>Already have an account? <button onClick={() => { setMode('signin'); clearFormState(); }} className="text-stone-950 font-normal underline ml-1 tracking-wide hover:text-[#c5a880] cursor-pointer transition-colors">Sign In</button></p>
                )}
                {(mode === 'forgot' || mode === 'resetpassword') && (
                  <p>Remembered your password? <button onClick={() => { setMode('signin'); clearFormState(); }} className="text-stone-950 font-normal underline ml-1 tracking-wide hover:text-[#c5a880] cursor-pointer transition-colors">Back to Sign In</button></p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}