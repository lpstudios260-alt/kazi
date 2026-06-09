import React, { useState, useEffect } from 'react';
import { Video, Calendar as CalendarIcon, Clock, Link as LinkIcon, Loader2, RefreshCw, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/firebase';
import { User } from 'firebase/auth';
import { MeetingWorkspace } from './MeetingWorkspace';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  hangoutLink?: string;
}

export function Meetings() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [hasGoogleToken, setHasGoogleToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [createdMeetUrl, setCreatedMeetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (u) => {
        setUser(u);
        const token = await getAccessToken();
        if (token) {
          setHasGoogleToken(true);
          setNeedsAuth(false);
        } else {
          setHasGoogleToken(false);
          setNeedsAuth(true); // Treat as needing auth for this specific module
        }
      },
      () => {
        setUser(null);
        setHasGoogleToken(false);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const timeMin = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=10&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items) {
        setUpcomingEvents(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch upcoming events", err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (!needsAuth && user) {
      fetchEvents();
    }
  }, [needsAuth, user]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setError('Popup blocked. Please open this app in a new tab using the "Open in new tab" button at the top right of the preview window to sign in.');
      } else {
        setError(err.message || "Failed to log in with Google.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedMeetUrl(null);
    setIsLoading(true);
    
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication required.");

      const startDateTimeStr = `${startDate}T${startTime}:00`;
      const startDateTime = new Date(startDateTimeStr);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

      const event = {
        summary: title || "New Online Meeting",
        start: {
          dateTime: startDateTime.toISOString(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
        },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: {
              type: "hangoutsMeet"
            }
          }
        }
      };

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(event)
      });
      
      const data = await res.json();
      if (!res.ok) {
         throw new Error(data.error?.message || "Failed to create meeting");
      }

      const meetLink = data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
      if (meetLink) {
         setCreatedMeetUrl(meetLink);
         fetchEvents(); // Refresh meetings
      } else {
         throw new Error("Meeting was created but no Google Meet link was returned.");
      }
    } catch(err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (needsAuth) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFAFA] h-full text-stone-900">
        <Video className="w-12 h-12 text-stone-400 mb-6" />
        <h2 className="text-2xl font-serif text-stone-900 mb-3 tracking-tight" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Connect Workspace</h2>
        <p className="text-[15px] text-stone-500 max-w-md text-center mb-8">
          Grant access to Google Calendar and Meet to easily schedule online meetings and interact with your digital workspace.
        </p>
        
        {error && <div className="mb-4 text-sm text-red-600 font-medium">{error}</div>}

        <button 
           onClick={handleLogin}
           disabled={isLoggingIn}
           className="gsi-material-button text-stone-800 disabled:opacity-50"
           style={{ backgroundColor: 'white', border: '1px solid #d4d4d8', borderRadius: '4px', padding: '0 12px', height: '40px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: '500', fontSize: '14px' }}
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
            <div className="gsi-material-button-icon" style={{ marginRight: '10px' }}>
              <svg width="18" height="18" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">Connect Google Account</span>
          </div>
        </button>
      </div>
    );
  }

  if (selectedMeeting) {
    return <MeetingWorkspace event={selectedMeeting} onBack={() => setSelectedMeeting(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FAFAFA] text-stone-900 selection:bg-stone-200 hide-scrollbar pb-12">
      <div className="max-w-4xl mx-auto w-full px-8 pt-16 mt-8">
        
        <div className="flex items-center justify-between mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-stone-200/60 p-1.5 rounded-lg text-stone-600 block w-fit">
                <Video className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold text-stone-500 uppercase tracking-widest">Workspace</span>
            </div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-snug">
              Schedule Meeting
            </h1>
          </motion.div>
          <div className="flex items-center gap-3">
             <div className="text-sm font-medium text-stone-600">{user?.email}</div>
             <button onClick={logout} className="text-xs font-semibold px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg transition-colors">Sign out</button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm flex flex-col gap-6"
        >
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 font-medium text-sm">
              {error}
            </div>
          )}

          {createdMeetUrl ? (
            <div className="bg-green-50 text-green-800 p-6 rounded-2xl border border-green-200 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Meeting Scheduled successfully!</h3>
              <p className="text-sm text-green-700 mb-6">Your meeting has been added to Google Calendar.</p>
              
              <div className="w-full max-w-md flex items-center justify-between bg-white border border-green-200 px-4 py-3 rounded-xl mb-4 text-left">
                <div className="flex items-center gap-3 overflow-hidden text-ellipsis">
                  <LinkIcon className="w-5 h-5 text-stone-400 shrink-0" />
                  <span className="font-medium text-sm text-stone-700 truncate">{createdMeetUrl}</span>
                </div>
                <button 
                  onClick={() => {
                    const event = upcomingEvents.find(e => e.hangoutLink === createdMeetUrl);
                    if (event) {
                      setSelectedMeeting(event);
                    }
                  }}
                  className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Join now
                </button>
              </div>

              <button 
                onClick={() => { setCreatedMeetUrl(null); setTitle('');  }}
                className="mt-2 text-stone-600 hover:text-stone-800 text-sm font-medium font-sans"
              >
                Schedule another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSchedule} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Meeting Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Roadmap Review"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-stone-400" /> Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-stone-400" /> Time</label>
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Duration</label>
                    <select 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm appearance-none"
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={isLoading || !title || !startDate || !startTime}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                  {isLoading ? 'Scheduling...' : 'Create Google Meet Link'}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Upcoming Meetings List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm flex flex-col"
        >
          <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-stone-400" /> Upcoming Meetings
            </h2>
            <button 
              onClick={fetchEvents}
              disabled={isLoadingEvents}
              className="text-stone-500 hover:text-stone-800 disabled:opacity-50 transition-colors p-1"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingEvents ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex flex-col p-4 md:p-6 gap-3 min-h-[200px]">
             {isLoadingEvents && upcomingEvents.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-stone-400 py-8">
                 <Loader2 className="w-6 h-6 animate-spin mb-2" />
                 <span className="text-sm">Loading events...</span>
               </div>
             ) : upcomingEvents.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-stone-400 py-10 text-center">
                 <CalendarIcon className="w-8 h-8 mb-3 opacity-50" />
                 <p className="text-sm font-medium text-stone-500">No upcoming meetings</p>
                 <p className="text-xs mt-1">Events from your primary calendar will appear here.</p>
               </div>
             ) : (
               upcomingEvents.map((event) => {
                 // Format dates nicely
                 let dateStr = '';
                 let timeStr = '';
                 const d = event.start.dateTime ? new Date(event.start.dateTime) : (event.start.date ? new Date(event.start.date) : null);
                 if (d) {
                   dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                   if (event.start.dateTime) {
                     timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                   } else {
                     timeStr = 'All day';
                   }
                 }

                 return (
                   <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-stone-200/60 hover:border-stone-300 hover:bg-stone-50/50 transition-all">
                     <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-stone-900 truncate mb-1">{event.summary || '(No title)'}</h3>
                       <div className="flex items-center gap-3 text-xs font-medium text-stone-500">
                         <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> {dateStr}</span>
                         <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeStr}</span>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-2">
                       {event.hangoutLink ? (
                         <button
                           onClick={() => setSelectedMeeting(event)}
                           className="shrink-0 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                         >
                           <Video className="w-4 h-4" /> Join 
                         </button>
                       ) : (
                         <span className="shrink-0 text-xs font-medium text-stone-400 bg-stone-100 px-3 py-1.5 rounded-lg">
                           No Video Link
                         </span>
                       )}
                       <button
                         onClick={() => setSelectedMeeting(event)}
                         className="shrink-0 flex items-center justify-center gap-2 bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                       >
                         <FileText className="w-4 h-4" /> AI Notes
                       </button>
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
