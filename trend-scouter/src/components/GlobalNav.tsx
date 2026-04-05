import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    IconBulb,
    IconCrown,
    IconUser,
    IconLogout,
    IconBookmarkFilled,
    IconReportAnalytics,
} from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function GlobalNav() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <IconBulb className="text-primary-foreground w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-primary">Trend Intelligence</span>
                    </Link>

                    {/* Right Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        {user && (
                            <Link href="/workspace">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <IconBookmarkFilled size={18} className="text-primary" />
                                    워크스페이스
                                </Button>
                            </Link>
                        )}
                        <Link href="/trends">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <IconReportAnalytics size={18} />
                                전체 트렌드
                            </Button>
                        </Link>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                                    <IconUser size={16} className="text-primary" />
                                    <span className="text-xs font-bold truncate max-w-[120px]">
                                        {user.email?.split('@')[0]}
                                    </span>
                                </div>
                                <form action={signOut}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <IconLogout size={18} />
                                        로그아웃
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <IconUser size={18} />
                                    로그인
                                </Button>
                            </Link>
                        )}

                        <Link href="/premium">
                            <Button size="sm" className="gap-2 rounded-full font-bold shadow-md shadow-primary/10">
                                <IconCrown size={18} />
                                Premium 가입
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu */}
                    <div className="flex md:hidden items-center gap-2">
                        {user ? (
                            <form action={signOut}>
                                <Button variant="ghost" size="sm">
                                    <IconLogout size={18} />
                                </Button>
                            </form>
                        ) : (
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    <IconUser size={18} />
                                </Button>
                            </Link>
                        )}
                        <Link href="/premium">
                            <Button size="sm" className="gap-1 rounded-full font-bold text-xs">
                                <IconCrown size={14} />
                                Premium
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
