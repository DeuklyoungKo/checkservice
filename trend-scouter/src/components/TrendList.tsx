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
    IconChevronLeft,
    IconChevronRight,
} from "@tabler/icons-react"
import { BookmarkButton } from "@/components/BookmarkButton"

const PAGE_SIZE = 9

interface Trend {
    id: string
    title: string
    pain_category: 'Functional' | 'Financial' | 'Emotional'
    pufe_total: number
    description: string
    tags: string[]
    isBookmarked: boolean
    upvotes: number
    analysis?: {
        pufe_p: number
        pufe_u: number
        pufe_f: number
        pufe_e: number
    }
}

interface TrendListProps {
    initialTrends: Trend[]
}

export function TrendList({ initialTrends }: TrendListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'score' | 'newest' | 'difficulty'>('newest')
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)

    const categories = useMemo(() => {
        const cats = new Set(initialTrends.map(t => t.pain_category))
        return ['all', ...Array.from(cats)]
    }, [initialTrends])

    const filteredAndSortedTrends = useMemo(() => {
        let result = [...initialTrends]

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.pain_category.toLowerCase().includes(q) ||
                t.tags.some(tag => tag.toLowerCase().includes(q))
            )
        }

        if (filterCategory !== 'all') {
            result = result.filter(t => t.pain_category === filterCategory)
        }

        result.sort((a, b) => {
            if (sortBy === 'score') return b.pufe_total - a.pufe_total
            return 0
        })

        return result
    }, [initialTrends, searchQuery, sortBy, filterCategory])

    // Reset page when filters change
    const handleSearch = (q: string) => { setSearchQuery(q); setCurrentPage(1) }
    const handleCategory = (c: string) => { setFilterCategory(c); setCurrentPage(1) }
    const handleSort = (s: 'score' | 'newest' | 'difficulty') => { setSortBy(s); setCurrentPage(1) }

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedTrends.length / PAGE_SIZE))
    const paginatedTrends = filteredAndSortedTrends.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    )

    return (
        <div className="space-y-8">
            {/* Search & Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-6 rounded-3xl border border-muted-foreground/10">
                <div className="relative w-full md:w-96 group">
                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="아이디어, 태그, 카테고리 검색..."
                        className="w-full bg-background border-2 border-muted rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-background border-2 border-muted rounded-2xl px-3 py-1.5 shadow-sm">
                        <IconFilter size={18} className="text-muted-foreground" />
                        <select
                            value={filterCategory}
                            onChange={(e) => handleCategory(e.target.value)}
                            className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'all' ? '전체 카테고리' : cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-background border-2 border-muted rounded-2xl px-3 py-1.5 shadow-sm">
                        <IconSortDescending size={18} className="text-muted-foreground" />
                        <select
                            value={sortBy}
                            onChange={(e) => handleSort(e.target.value as any)}
                            className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
                        >
                            <option value="newest">최신순</option>
                            <option value="score">수익점수 높은순</option>
                            <option value="difficulty">난이도 낮은순</option>
                        </select>
                    </div>

                    {/* Result count */}
                    <span className="text-sm text-muted-foreground font-bold hidden md:block">
                        총 {filteredAndSortedTrends.length}개
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedTrends.length > 0 ? (
                    paginatedTrends.map((trend) => (
                        <Card key={trend.id} className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden rounded-3xl bg-card flex flex-col h-full">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        {trend.pain_category}
                                    </Badge>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-primary leading-none">{trend.pufe_total}</span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">PUFE</span>
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
                                            <IconTrendingUp size={12} /> 언급수/기여도
                                        </p>
                                        <p className="text-sm font-bold">{trend.upvotes}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                                            <IconChartBar size={12} /> Pain 유형
                                        </p>
                                        <p className={`text-sm font-bold ${trend.pain_category === 'Emotional' ? 'text-orange-500' : 'text-foreground'}`}>
                                            {trend.pain_category}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full h-10 w-10 p-0"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <IconChevronLeft size={18} />
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`h-10 w-10 rounded-full text-sm font-bold transition-all ${
                                    currentPage === page
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full h-10 w-10 p-0"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <IconChevronRight size={18} />
                    </Button>
                </div>
            )}

            {/* Page info */}
            {totalPages > 1 && (
                <p className="text-center text-xs text-muted-foreground font-bold">
                    {currentPage} / {totalPages} 페이지 &nbsp;·&nbsp; 총 {filteredAndSortedTrends.length}개
                </p>
            )}
        </div>
    )
}
