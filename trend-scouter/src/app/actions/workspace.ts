'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBookmark(trendId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('로그인이 필요한 서비스입니다.')
    }

    // 기존 북마크 확인
    const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('trend_id', trendId)
        .single()

    if (existing) {
        // 북마크 삭제
        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', existing.id)

        if (error) throw error
    } else {
        // 북마크 추가
        const { error } = await supabase
            .from('bookmarks')
            .insert({
                user_id: user.id,
                trend_id: trendId
            })

        if (error) throw error
    }

    revalidatePath('/')
    revalidatePath('/workspace')
    revalidatePath(`/trend/${trendId}`)
}

export async function getBookmarks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
      *,
      trends (
        *,
        analysis (*)
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching bookmarks:', error)
        return []
    }

    return data
}
