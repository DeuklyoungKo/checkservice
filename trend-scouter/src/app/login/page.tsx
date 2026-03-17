import { login, signup, signInWithGoogle } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBrandGoogle, IconBulb, IconMail, IconLock } from "@tabler/icons-react";
import Link from "next/link";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const error = params.error as string;
    const message = params.message as string;

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 font-sans focus-visible:selection:bg-primary/20">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <IconBulb className="text-primary-foreground w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-primary">Trend Intelligence</span>
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight">다시 오신 것을 환영합니다</h1>
                    <p className="text-muted-foreground">인증된 트렌드 정보를 확인하고 나만의 워크스페이스를 관리하세요.</p>
                </div>

                <Card className="border-2 shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden bg-card">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">로그인 / 회원가입</CardTitle>
                        <CardDescription>이메일이나 소셜 계정으로 시작하세요.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl font-medium">
                                {decodeURIComponent(error)}
                            </div>
                        )}
                        {message && (
                            <div className="bg-primary/10 border border-primary/20 text-primary text-sm p-3 rounded-xl font-medium">
                                {decodeURIComponent(message)}
                            </div>
                        )}

                        <form className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="email">이메일 주소</label>
                                <div className="relative">
                                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        className="w-full bg-muted/50 border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="password">비밀번호</label>
                                <div className="relative">
                                    <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-muted/50 border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <Button formAction={login} className="rounded-xl font-bold h-12">로그인</Button>
                                <Button formAction={signup} variant="outline" className="rounded-xl font-bold h-12">회원가입</Button>
                            </div>
                        </form>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">Or continue with</span>
                            </div>
                        </div>

                        <form>
                            <Button
                                formAction={signInWithGoogle}
                                variant="outline"
                                className="w-full rounded-xl font-bold h-12 gap-3 hover:bg-muted transition-colors"
                                type="submit"
                            >
                                <IconBrandGoogle size={20} className="text-primary" />
                                Google 계정으로 계속하기
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-4 border-t">
                        <p className="text-xs text-center w-full text-muted-foreground leading-relaxed">
                            계속 진행함으로써 Trend Intelligence의 <Link href="#" className="underline hover:text-primary">서비스 약관</Link> 및 <Link href="#" className="underline hover:text-primary">개인정보 보호정책</Link>에 동의하게 됩니다.
                        </p>
                    </CardFooter>
                </Card>

                <p className="text-center text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-primary transition-colors font-medium">← 홈으로 돌아가기</Link>
                </p>
            </div>
        </div>
    )
}
