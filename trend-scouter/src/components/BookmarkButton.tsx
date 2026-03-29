'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { IconBookmark, IconBookmarkFilled } from '@tabler/icons-react'
import { toggleBookmark } from '@/app/actions/workspace'

interface BookmarkButtonProps {
    trendId: string
    initialIsBookmarked: boolean
    size?: 'sm' | 'default'
}

export function BookmarkButton({ trendId, initialIsBookmarked, size = 'default' }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
    const [isPending, startTransition] = useTransition()

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault() // 링크 클릭 방지
        e.stopPropagation()

        // 낙관적 업데이트
        const previousState = isBookmarked
        setIsBookmarked(!previousState)

        startTransition(async () => {
            try {
                await toggleBookmark(trendId)
            } catch (error: any) {
                setIsBookmarked(previousState)
                alert(error.message || '로그인이 필요한 기능입니다.')
            }
        })
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`rounded-xl transition-all ${isBookmarked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
            onClick={handleToggle}
            disabled={isPending}
        >
            {isBookmarked ? (
                <IconBookmarkFilled size={20} className="animate-in zoom-in duration-300" />
            ) : (
                <IconBookmark size={20} />
            )}
        </Button>
    )
}
