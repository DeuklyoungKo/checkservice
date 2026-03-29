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
    IconArrowRight,
    IconRocket,
    IconBulb
} from "@tabler/icons-react"
import { BookmarkButton } from "@/components/BookmarkButton"

const PAGE_SIZE = 9

interface Trend {
    id: string;
    title: string;
    description: string;
    category: string;
    score: number;
    difficulty: string;
    potential: string;
    tags: string[];
    isBookmarked: boolean;
    isUnlocked: boolean; // 추가됨
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
        const cats = new Set(initialTrends.map(t => t.category))
        return ['all', ...Array.from(cats)]
    }, [initialTrends])

    const filteredAndSortedTrends = useMemo(() => {
        let result = [...initialTrends]

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q)
            )
        }

        if (filterCategory !== 'all') {
            result = result.filter(t => t.category === filterCategory)
        }

        if (sortBy === 'score') {
            result.sort((a, b) => b.score - a.score)
        } else if (sortBy === 'difficulty') {
            const diffMap = { '쉬움': 0, '보통': 1, '어려움': 2 }
            result.sort((a, b) => (diffMap[a.difficulty as keyof typeof diffMap] || 0) - (diffMap[b.difficulty as keyof typeof diffMap] || 0))
        }

        return result
    }, [initialTrends, searchQuery, sortBy, filterCategory])

    const paginatedTrends = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredAndSortedTrends.slice(start, start + PAGE_SIZE)
    }, [filteredAndSortedTrends, currentPage])

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedTrends.length / PAGE_SIZE))

    const handleSearch = (q: string) => { setSearchQuery(q); setCurrentPage(1) }
    const handleCategory = (c: string) => { setFilterCategory(c); setCurrentPage(1) }
    const handleSort = (s: 'score' | 'newest' | 'difficulty') => { setSortBy(s); setCurrentPage(1) }

    return (
        <div className="space-y-12">
            {/* Search & Filter Controls */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-muted/20 p-6 rounded-[32px] border border-muted-foreground/10">
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

                    <span className="text-sm text-muted-foreground font-bold hidden md:block">
                        총 {filteredAndSortedTrends.length}개
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedTrends.length > 0 ? (
                    paginatedTrends.map((trend) => (
                        <Card key={trend.id} className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden rounded-3xl bg-card flex flex-col h-full relative">
                            {/* Premium Badge */}
                            {!trend.isUnlocked && (
                                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-amber-500/20 uppercase tracking-widest border border-white/20">
                                    <IconRocket size={12} className="text-white animate-pulse" />
                                    Premium
                                </div>
                            )}

                            <CardHeader className="pb-4 pt-8">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        {trend.category}
                                    </Badge>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-primary leading-none">{trend.score}</span>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Score</span>
                                        <div className="mt-2 text-right">
                                            <BookmarkButton trendId={trend.id} initialIsBookmarked={trend.isBookmarked} size="sm" />
                                        </div>
                                    </div>
                                </div>
                                <CardTitle className="text-2xl group-hover:text-primary transition-colors mb-2 line-clamp-2 min-h-[4rem] flex items-center gap-2">
                                    {!trend.isUnlocked && <IconBulb size={24} className="text-amber-500 flex-shrink-0" />}
                                    {trend.title}
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed line-clamp-3 h-[4.5rem]">
                                    {trend.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pb-6 flex-grow">
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

                            <CardFooter className="bg-muted/30 p-4 mt-auto border-t border-muted/50">
                                <Link href={`/trend/${trend.id}`} className="w-full">
                                    {trend.isUnlocked ? (
                                        <Button className="w-full rounded-xl font-bold bg-muted hover:bg-primary hover:text-primary-foreground text-foreground transition-all duration-300" variant="ghost">
                                            심층 분석 데이터 보기
                                            <IconArrowRight size={16} className="ml-2" />
                                        </Button>
                                    ) : (
                                        <Button className="w-full rounded-xl font-black bg-primary/10 text-primary hover:bg-primary transition-all duration-300 border border-primary/20" variant="ghost">
                                            분석 데이터 잠금 해제
                                            <IconRocket size={16} className="ml-2 scale-110" />
                                        </Button>
                                    )}
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-muted/10 rounded-[48px] border-2 border-dashed border-muted">
                        <p className="text-muted-foreground font-bold">검색 결과가 없습니다.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="rounded-xl font-bold"
                    >
                        이전
                    </Button>
                    <span className="text-sm font-bold">
                        {currentPage} / {totalPages}
                    </span>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="rounded-xl font-bold"
                    >
                        다음
                    </Button>
                </div>
            )}
        </div>
    )
}
