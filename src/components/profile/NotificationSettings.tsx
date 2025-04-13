'use client';

import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../lib/supabase/client';
import type { UserPreferences } from '../../../types/database';

export function NotificationSettings() {
  const { supabase } = useSupabase();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not found');
          return;
        }

        const { data, error: prefError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (prefError) throw prefError;
        setPreferences(data);
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError('Failed to load notification preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [supabase]);

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ email_notifications: enabled })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPreferences(prev => prev ? { ...prev, email_notifications: enabled } : null);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError('Failed to update notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateThreshold = async (threshold: number) => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ price_alert_threshold: threshold })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPreferences(prev => prev ? { ...prev, price_alert_threshold: threshold } : null);
    } catch (err) {
      console.error('Error updating price alert threshold:', err);
      setError('Failed to update price alert threshold');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        No preferences found. Please contact support.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-500">
              Receive email updates about price changes and important alerts
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggleNotifications(!preferences.email_notifications)}
            disabled={isSaving}
            className={`${
              preferences.email_notifications
                ? 'bg-indigo-600'
                : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50`}
          >
            <span className="sr-only">Toggle email notifications</span>
            <span
              className={`${
                preferences.email_notifications ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        {/* Price Alert Threshold */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Price Alert Threshold</h3>
          <p className="text-sm text-gray-500 mb-4">
            Get notified when price changes exceed this percentage
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="50"
              value={preferences.price_alert_threshold}
              onChange={(e) => handleUpdateThreshold(Number(e.target.value))}
              disabled={isSaving}
              className="w-64"
            />
            <span className="text-gray-900 font-medium">
              {preferences.price_alert_threshold}%
            </span>
          </div>
        </div>

        {/* Currency Preference */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preferred Currency</h3>
          <p className="text-sm text-gray-500">
            Currently set to: {preferences.preferred_currency}
          </p>
        </div>
      </div>
    </div>
  );
} 