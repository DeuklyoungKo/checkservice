'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }
    const redirectTo = formData.get('redirectTo') as string | null;

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        const redirectParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : '';
        redirect('/login?error=' + encodeURIComponent(error.message) + redirectParam)
    }

    revalidatePath('/', 'layout')
    redirect(redirectTo || '/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/login?error=' + encodeURIComponent(error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Check your email to confirm your account')
}

export async function signInWithGoogle(formData: FormData) {
    const supabase = await createClient()
    const redirectTo = formData.get('redirectTo') as string | null;

    const siteUrl = await getSiteUrl();
    const callbackUrl = new URL(`${siteUrl}/auth/callback`);
    if (redirectTo) {
        callbackUrl.searchParams.set('redirectTo', redirectTo);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: callbackUrl.toString(),
        },
    })

    if (error) {
        redirect('/login?error=' + encodeURIComponent(error.message))
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/')
}
