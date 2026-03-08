'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
    IconTrendingUp,
    IconClock,
    IconChartBar,
    IconSearch,
    IconFilter,
    IconSortDescending,
} from "@tabler/icons-react"
import { BookmarkButton } from "@/components/BookmarkButton"

interface Trend {
    id: string
    title: string
    category: string
    score: number
    difficulty: string
    potential: string
    description: string
    tags: string[]
    isBookmarked: boolean
}

interface TrendListProps {
    initialTrends: Trend[]
}

export function TrendList({ initialTrends }: TrendListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'score' | 'newest' | 'difficulty'>('newest')
    const [filterCategory, setFilterCategory] = useState<string>('all')

    const categories = useMemo(() => {
        const cats = new Set(initialTrends.map(t => t.category))
        return ['all', ...Array.from(cats)]
    }, [initialTrends])

    const filteredAndSortedTrends = useMemo(() => {
        let result = [...initialTrends]

        // 1. Filter by Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q) ||
                t.tags.some(tag => tag.toLowerCase().includes(q))
            )
        }

        // 2. Filter by Category
        if (filterCategory !== 'all') {
            result = result.filter(t => t.category === filterCategory)
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sortBy === 'score') return b.score - a.score
            if (sortBy === 'difficulty') {
                const diffMap: Record<string, number> = { '쉬움': 1, '보통': 2, '어려움': 3 }
                return (diffMap[a.difficulty] || 0) - (diffMap[b.difficulty] || 0)
            }
            return 0 // default to newest (initial order)
        })

        return result
    }, [initialTrends, searchQuery, sortBy, filterCategory])

    return (
        <div className="space-y-8">
            {/* Search & Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-6 rounded-3xl border border-muted-foreground/10">
                <div className="relative w-full md:w-96 group">
                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="아이디어, 태그, 카테고리 검색..."
                        className="w-full bg-background border-2 border-muted rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Category Filter */}
                    <div className="flex items-center gap-2 bg-background border-2 border-muted rounded-2xl px-3 py-1.5 shadow-sm">
                        <IconFilter size={18} className="text-muted-foreground" />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'all' ? '전체 카테고리' : cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Control */}
                    <div className="flex items-center gap-2 bg-background border-2 border-muted rounded-2xl px-3 py-1.5 shadow-sm">
                        <IconSortDescending size={18} className="text-muted-foreground" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
                        >
                            <option value="newest">최신순</option>
                            <option value="score">수익점수 높은순</option>
                            <option value="difficulty">난이도 낮은순</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedTrends.length > 0 ? (
                    filteredAndSortedTrends.map((trend) => (
                        <Card key={trend.id} className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden rounded-3xl bg-card flex flex-col h-full">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        {trend.category}
                                    </Badge>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-primary leading-none">{trend.score}</span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Score</span>
                                        <div className="mt-2">
                                            <BookmarkButton trendId={trend.id} initialIsBookmarked={trend.isBookmarked} />
                                        </div>
                                    </div>
                                </div>
                                <CardTitle className="text-2xl group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                    {trend.title}
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed line-clamp-3 h-[4.5rem]">
                                    {trend.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pb-6 flex-grow">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {trend.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="rounded-md border-muted text-muted-foreground text-[10px]">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                                <Separator className="mb-6 opacity-30" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                                            <IconClock size={12} /> 난이도
                                        </p>
                                        <p className="text-sm font-bold">{trend.difficulty}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                                            <IconChartBar size={12} /> 잠재력
                                        </p>
                                        <p className={`text-sm font-bold ${trend.potential === '높음' ? 'text-orange-500' : 'text-foreground'}`}>
                                            {trend.potential}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="bg-muted/30 p-4 mt-auto">
                                <Link href={`/trend/${trend.id}`} className="w-full">
                                    <Button className="w-full rounded-xl font-bold bg-muted hover:bg-primary hover:text-primary-foreground text-foreground transition-all duration-300" variant="ghost">
                                        심층 분석 데이터 보기
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-muted-foreground text-lg">검색 결과가 없습니다. 다른 키워드로 시도해 보세요.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
