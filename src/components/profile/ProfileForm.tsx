'use client';

import React, { useState } from 'react';
import type { UserProfile } from '../../../types/database';
import Image from 'next/image';

interface ProfileFormProps {
  profile: UserProfile;
  onSave: (profile: Partial<UserProfile>) => Promise<void>;
}

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    avatar_url: profile.avatar_url || '',
    bio: profile.bio || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Edit Profile
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Display Name</h3>
            <p className="mt-1 text-lg text-gray-900">{profile.display_name || 'Not set'}</p>
          </div>

          {profile.avatar_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Avatar</h3>
              <Image
                src={profile.avatar_url}
                alt="Profile avatar"
                width={100}
                height={100}
                className="rounded-full"
              />
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Bio</h3>
            <p className="mt-1 text-gray-900">{profile.bio || 'No bio provided'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Email Verification</h3>
            <p className="mt-1 text-gray-900">
              {profile.email_verified ? (
                <span className="text-green-600">✓ Verified</span>
              ) : (
                <span className="text-red-600">Not verified</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="text-gray-600 hover:text-gray-500 font-medium"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
            Display Name
          </label>
          <input
            type="text"
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
            Avatar URL
          </label>
          <input
            type="url"
            id="avatar_url"
            value={formData.avatar_url}
            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
} 