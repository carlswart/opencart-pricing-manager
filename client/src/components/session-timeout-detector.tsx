import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Session activity timeout detector
// This component monitors user activity and checks for session timeout
export function SessionTimeoutDetector() {
  const [, navigate] = useLocation();
  const { user, serverRestarted } = useAuth();
  const { toast } = useToast();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(15); // Default 15 minutes
  const [checkingSession, setCheckingSession] = useState<boolean>(false);

  // Fetch session timeout setting on component mount
  useEffect(() => {
    if (user) {
      const fetchTimeoutSetting = async () => {
        try {
          const response = await fetch('/api/settings/session');
          if (response.ok) {
            const data = await response.json();
            if (data && data.timeoutMinutes) {
              setTimeoutMinutes(data.timeoutMinutes);
            }
          }
        } catch (error) {
          console.error('Failed to fetch session timeout setting:', error);
        }
      };
      
      fetchTimeoutSetting();
    }
  }, [user]);

  // Reset activity timestamp on user actions
  useEffect(() => {
    const resetActivityTimestamp = () => {
      setLastActivity(Date.now());
    };

    // Listen for user activity
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetActivityTimestamp);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivityTimestamp);
      });
    };
  }, []);

  // Check for session timeout periodically
  useEffect(() => {
    if (!user || serverRestarted) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      
      // If user has been inactive for too long
      if (inactiveTime > timeoutMs * 0.8 && !checkingSession) {
        // Check if session is still valid by making a request to the API
        setCheckingSession(true);
        
        apiRequest('GET', '/api/user')
          .then(response => {
            if (!response.ok) {
              // Session likely expired, redirect to login
              toast({
                title: 'Session expired',
                description: 'Your session has timed out due to inactivity. Please log in again.',
                variant: 'destructive',
              });
              navigate('/auth');
            }
          })
          .catch(() => {
            // Error making request, assume session expired
            toast({
              title: 'Session expired',
              description: 'Your session has timed out. Please log in again.',
              variant: 'destructive',
            });
            navigate('/auth');
          })
          .finally(() => {
            setCheckingSession(false);
          });
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [user, lastActivity, timeoutMinutes, checkingSession, navigate, toast, serverRestarted]);

  // This component doesn't render anything
  return null;
}