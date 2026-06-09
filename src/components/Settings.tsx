import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Building2, Save, Loader2, Link as LinkIcon, Users, Target, CheckCircle2, UserCircle, LogOut } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

function ProfileConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [missionStatement, setMissionStatement] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'clientProfiles', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCompanyName(data.companyName || '');
            setIndustry(data.industry || '');
            setStage(data.stage || '');
            setMissionStatement(data.missionStatement || '');
            setTargetAudience(data.targetAudience || '');
            setWebsiteUrl(data.websiteUrl || '');
          }
        } catch (err: any) {
          console.error("Error fetching profile", err);
          setError("Failed to load profile. Please make sure you are logged in.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setError(null);
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const docRef = doc(db, 'clientProfiles', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      const updateData = {
        userId: auth.currentUser.uid,
        companyName,
        industry,
        stage,
        missionStatement,
        targetAudience,
        websiteUrl,
        updatedAt: serverTimestamp()
      };

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...updateData,
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(docRef, updateData, { merge: true });
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving profile", err);
      setError("Failed to save profile. Make sure you have the correct permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-900 tracking-snug mb-2">Startup Profile</h2>
        <p className="text-sm text-stone-500">Configure your company identity. AI agents will use this context to generate better marketing materials, slide decks, and tailored strategies.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Company Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-stone-400" />
              </div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="block w-full pl-10 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all text-sm font-medium"
                placeholder="e.g. Acme Corp"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Website URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <LinkIcon className="h-4 w-4 text-stone-400" />
              </div>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="block w-full pl-10 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all text-sm font-medium"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="block w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all text-sm font-medium"
              placeholder="e.g. FinTech, E-commerce, SaaS"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="block w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all text-sm font-medium appearance-none"
            >
              <option value="" disabled>Select Stage</option>
              <option value="Idea">Idea</option>
              <option value="Pre-Seed">Pre-Seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B+">Series B+</option>
              <option value="Bootstrapped">Bootstrapped</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-stone-400" /> Mission Statement
          </label>
          <textarea
            value={missionStatement}
            onChange={(e) => setMissionStatement(e.target.value)}
            rows={3}
            className="block w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all text-sm font-medium resize-none"
            placeholder="What problem are you solving and why?"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-stone-400" /> Target Audience
          </label>
          <textarea
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            rows={2}
            className="block w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all text-sm font-medium resize-none"
            placeholder="Who are your primary customers?"
          />
        </div>

        <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg"
              >
                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully
              </motion.div>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Profile Context'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function AccountConfig() {
  const user = auth.currentUser;

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm"
    >
       <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-900 tracking-snug mb-2">Account</h2>
        <p className="text-sm text-stone-500">Manage your account settings and preferences.</p>
      </div>

      <div className="flex items-center gap-4 p-4 border border-stone-200 rounded-2xl mb-6 bg-stone-50">
        <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center overflow-hidden">
          {user?.photoURL ? (
             <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="w-8 h-8 text-stone-400" />
          )}
        </div>
        <div>
          <div className="font-semibold text-stone-900">{user?.displayName || 'User'}</div>
          <div className="text-sm text-stone-500">{user?.email}</div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </motion.div>
  );
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] text-stone-900 pb-12">
      <div className="max-w-3xl mx-auto px-8 pt-16 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-stone-900 tracking-snug mb-6">
            Settings
          </h1>

          <div className="flex items-center gap-1 bg-stone-200/50 p-1 rounded-xl w-fit mb-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Startup Profile
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'account'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Account
            </button>
          </div>
          
          {activeTab === 'profile' && <ProfileConfig />}
          {activeTab === 'account' && <AccountConfig />}

        </motion.div>
      </div>
    </div>
  );
}
