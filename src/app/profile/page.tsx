'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { ProfileForm } from '../../components/profile/ProfileForm';
import { SavedProducts } from '../../components/profile/SavedProducts';
import { NotificationSettings } from '../../components/profile/NotificationSettings';
import { useSupabase } from '../../lib/supabase/client';
import type { UserProfile } from '../../../types/database';

export default function ProfilePage() {
  const { supabase } = useSupabase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'saved' | 'notifications'>('profile');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not found');
          return;
        }

        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [supabase]);

  const handleSaveProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh profile data
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(newProfile);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw new Error('Failed to update profile');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`${
                activeTab === 'saved'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Saved Products
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`${
                activeTab === 'notifications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Notification Settings
            </button>
          </nav>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
          <div>
            {activeTab === 'profile' && profile && (
              <ProfileForm profile={profile} onSave={handleSaveProfile} />
            )}
            {activeTab === 'saved' && (
              <SavedProducts />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings />
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 