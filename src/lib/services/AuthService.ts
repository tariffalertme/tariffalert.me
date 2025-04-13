import { SupabaseClient, AuthError as SupabaseAuthError, PostgrestError } from '@supabase/supabase-js';
import { Logger } from '../../../lib/utils/logger';
import type { Database } from '../../../types/database';
import type { UserProfile, UserPreferences } from '../../../types/database';

export interface AuthError {
  message: string;
  status: number;
}

export class AuthService {
  private readonly supabase: SupabaseClient<Database>;
  private readonly logger: Logger;

  constructor(supabase: SupabaseClient<Database>, logger: Logger) {
    this.supabase = supabase;
    this.logger = logger;
  }

  private getErrorStatus(error: PostgrestError | SupabaseAuthError): number {
    if ('code' in error && error.code) {
      const parsed = parseInt(error.code);
      return isNaN(parsed) ? 500 : parsed;
    }
    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }
    return 500;
  }

  async signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create user profile and preferences
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        await Promise.all([
          this.createUserProfile(user.id),
          this.createUserPreferences(user.id)
        ]);
      }

      return { error: null };
    } catch (err) {
      const error = err as SupabaseAuthError;
      this.logger.error('Error during sign up', { error });
      return {
        error: {
          message: error.message || 'An error occurred during sign up',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (err) {
      const error = err as SupabaseAuthError;
      this.logger.error('Error during sign in', { error });
      return {
        error: {
          message: error.message || 'An error occurred during sign in',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      return { error: null };
    } catch (err) {
      const error = err as SupabaseAuthError;
      this.logger.error('Error during sign out', { error });
      return {
        error: {
          message: error.message || 'An error occurred during sign out',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      return { error: null };
    } catch (err) {
      const error = err as SupabaseAuthError;
      this.logger.error('Error during password reset', { error });
      return {
        error: {
          message: error.message || 'An error occurred during password reset',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;

      return { error: null };
    } catch (err) {
      const error = err as SupabaseAuthError;
      this.logger.error('Error updating password', { error });
      return {
        error: {
          message: error.message || 'An error occurred while updating password',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      const error = err as PostgrestError;
      this.logger.error('Error fetching user profile', { error });
      return {
        data: null,
        error: {
          message: error.message || 'An error occurred while fetching user profile',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update(profile)
        .eq('user_id', userId);

      if (error) throw error;

      return { error: null };
    } catch (err) {
      const error = err as PostgrestError;
      this.logger.error('Error updating user profile', { error });
      return {
        error: {
          message: error.message || 'An error occurred while updating user profile',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  async getUserPreferences(userId: string): Promise<{ data: UserPreferences | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      const error = err as PostgrestError;
      this.logger.error('Error fetching user preferences', { error });
      return {
        data: null,
        error: {
          message: error.message || 'An error occurred while fetching user preferences',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_id', userId);

      if (error) throw error;

      return { error: null };
    } catch (err) {
      const error = err as PostgrestError;
      this.logger.error('Error updating user preferences', { error });
      return {
        error: {
          message: error.message || 'An error occurred while updating user preferences',
          status: this.getErrorStatus(error)
        }
      };
    }
  }

  private async createUserProfile(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_profiles')
      .insert([{ user_id: userId }]);

    if (error) {
      this.logger.error('Error creating user profile', { error });
    }
  }

  private async createUserPreferences(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_preferences')
      .insert([{ user_id: userId }]);

    if (error) {
      this.logger.error('Error creating user preferences', { error });
    }
  }
} 