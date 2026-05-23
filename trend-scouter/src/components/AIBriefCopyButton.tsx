'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IconCopy, IconCheck } from '@tabler/icons-react'

interface AIBriefCopyButtonProps {
    briefText: string
}

export function AIBriefCopyButton({ briefText }: AIBriefCopyButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(briefText)
            setCopied(true)
            setTimeout(() => {
                setCopied(false)
            }, 2000)
        } catch (err) {
            console.error('Clipboard copy failed:', err)
            alert('복사에 실패했습니다. 기획서 텍스트를 수동으로 드래그하여 복사해 주세요.')
        }
    }

    return (
        <Button
            size="lg"
            onClick={handleCopy}
            className={`font-black rounded-2xl h-12 px-6 shadow-xl transition-all duration-300 transform active:scale-95 flex items-center gap-2 border-2 ${
                copied
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-500 shadow-green-500/10'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-primary/20 hover:scale-[1.03]'
            }`}
        >
            {copied ? (
                <>
                    <IconCheck size={18} className="animate-in zoom-in duration-300" />
                    <span>복사 완료! (Brief Copied)</span>
                </>
            ) : (
                <>
                    <IconCopy size={18} />
                    <span>AI 개발 브리프 복사 (Copy Prompt)</span>
                </>
            )}
        </Button>
    )
}
