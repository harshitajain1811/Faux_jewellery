import { useEffect, useState } from 'react';

interface UserProfileProps {
  user: { email: string; full_name?: string } | null;
  onUpdateProfile: (details: { full_name: string }) => void;
  onBack: () => void;
}

export default function UserProfilePage({ user, onUpdateProfile, onBack }: UserProfileProps) {
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.full_name) {
      setName(user.full_name);
    }
  }, [user?.full_name]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ full_name: name });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Mock data placeholder for order arrays
  const orders = [
    { id: 'ORD-9821', date: 'June 14, 2026', items: '1x Eternity Ring', total: 180, status: 'Shipped' },
    { id: 'ORD-4412', date: 'In Production', items: '1x Gold Choker', total: 450, status: 'Pending' }
  ];

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 space-y-8 select-none">
      <button onClick={onBack} className="text-xs font-sans text-stone-400 hover:text-stone-950 transition-colors cursor-pointer">
        ← Back to Homepage
      </button>

      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-serif text-2xl text-stone-900 uppercase tracking-wide">My Account Profile</h2>
        <p className="text-xs font-sans text-stone-500 mt-0.5">Manage your shipping information and look over your past orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: EDIT DETAILS FORM */}
        <form onSubmit={handleSave} className="md:col-span-5 bg-white p-6 border border-stone-200 rounded-sm space-y-4">
          <h3 className="text-sm font-sans font-medium uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">Personal Details</h3>
          
          {saveSuccess && (
            <div className="p-3 bg-stone-50 border border-stone-200 text-xs font-sans text-stone-700 rounded-xs">
              Profile details updated successfully.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">Account Email</label>
            <input type="text" disabled value={user?.email || ''} className="w-full bg-stone-50 border border-stone-200 text-stone-400 px-3 py-2 text-xs font-sans rounded-xs cursor-not-allowed" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">Display Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-3 py-2 text-xs font-sans text-stone-800 transition-colors rounded-xs" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-sans uppercase text-stone-400 tracking-wider">Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full bg-white border border-stone-200 focus:border-stone-950 outline-none px-3 py-2 text-xs font-sans text-stone-800 transition-colors rounded-xs" />
          </div>

          <button type="submit" className="w-full bg-stone-950 text-white py-2.5 text-xs font-sans uppercase tracking-widest hover:bg-stone-800 transition-colors rounded-xs mt-2 cursor-pointer">
            Save Details
          </button>
        </form>

        {/* RIGHT COLUMN: ORDERS TRACKING SECTION */}
        <div className="md:col-span-7 bg-white p-6 border border-stone-200 rounded-sm space-y-4">
          <h3 className="text-sm font-sans font-medium uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">Order History</h3>
          
          <div className="space-y-3">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 border border-stone-100 rounded-xs flex justify-between items-center bg-stone-50/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-sans font-medium text-stone-900">{ord.id}</span>
                    <span className={`text-[9px] font-sans uppercase tracking-wider px-2 py-0.5 rounded-xs ${
                      ord.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-stone-600">{ord.items}</p>
                  <p className="text-[10px] font-sans text-stone-400">{ord.date}</p>
                </div>
                <span className="text-xs font-sans font-medium text-stone-950">${ord.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}