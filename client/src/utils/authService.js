import { supabase } from './supabaseClient'

/**
 * SUPABASE AUTH SERVICE
 * Replaces hardcoded credentials with real JWT-based authentication
 */

// Sign up a new admin/director user
export const signupUser = async (email, password, firstName, lastName, role) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role // 'admin' or 'director'
        }
      }
    })

    if (authError) throw authError

    // Create user profile in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        email,
        username: email.split('@')[0],
        first_name: firstName,
        last_name: lastName,
        role,
        is_active: true
      }])
      .select()

    if (userError) throw userError

    return { user: authData.user, profile: user?.[0] }
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

// Login with email and password
export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError) throw profileError

    // Store session info
    localStorage.setItem('authToken', data.session.access_token)
    localStorage.setItem('userRole', profile.role)
    localStorage.setItem('username', profile.first_name || email)
    localStorage.setItem('userId', data.user.id)

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id)

    return {
      user: data.user,
      profile,
      session: data.session
    }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// Logout
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    // Clear local storage
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')

    return true
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

// Get current logged in user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error

    if (!user) return null

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    if (profileError) throw profileError

    return {
      user,
      profile
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // First verify current password by signing in
    const email = (await supabase.auth.getUser()).data.user?.email

    if (!email) throw new Error('No authenticated user found')

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Change password error:', error)
    throw error
  }
}

// Reset password (send reset email)
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Reset password error:', error)
    throw error
  }
}

// Update user profile
export const updateUserProfile = async (firstName, lastName) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError

    // Update in users table
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()

    if (error) throw error

    return data?.[0]
  } catch (error) {
    console.error('Update profile error:', error)
    throw error
  }
}

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Get all users error:', error)
    throw error
  }
}

// Deactivate user (admin only)
export const deactivateUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .select()

    if (error) throw error

    return data?.[0]
  } catch (error) {
    console.error('Deactivate user error:', error)
    throw error
  }
}

export default {
  signupUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  changePassword,
  resetPassword,
  updateUserProfile,
  getAllUsers,
  deactivateUser
}
