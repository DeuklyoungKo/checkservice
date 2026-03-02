import Image from "next/image";

export default function Home() {
  const trends = [
    {
      id: 1,
      title: "AI 기반 PDF 요약 및 시각화 툴",
      category: "SaaS / Productivity",
      score: 92,
      difficulty: "보통",
      potential: "높음",
      description: "단순 텍스트 요약을 넘어 핵심 컨셉을 다이어그램으로 자동 시각화해주는 서비스. 북미 Indie Hackers에서 급증 중.",
      tags: ["AI", "LLM", "B2B"],
    },
    {
      id: 2,
      title: "커뮤니티 전용 중고 거래 알림이",
      category: "Tool / Utility",
      score: 85,
      difficulty: "쉬움",
      potential: "보통",
      description: "네이버 카페, 디스콰이엇 등 흩어진 커뮤니티의 특정 키워드 매물을 실시간 푸시로 모아주는 앱.",
      tags: ["Crawling", "Local"],
    },
    {
      id: 3,
      title: "인스타 쇼츠 대본 자동 생성기",
      category: "Content Tech",
      score: 88,
      difficulty: "보통",
      potential: "높음",
      description: "특정 키워드만 넣으면 시청 지속 시간을 극대화하는 숏폼 대본과 자막 데이터를 생성.",
      tags: ["Creator Economy", "AI"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
                T
              </div>
              <span className="text-xl font-bold tracking-tight">Trend Scouter</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
              <a href="#" className="hover:text-white transition-colors">대시보드</a>
              <a href="#" className="hover:text-white transition-colors">리포트</a>
              <a href="#" className="hover:text-white transition-colors">설정</a>
              <button className="bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors">
                Premium 가입
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-3xl">
          <h2 className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-4">
            Next Big Opportunity
          </h2>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
            AI가 찾아낸 <br />가장 유망한 비즈니스 기회
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            Global 트렌드 데이터를 분석하여 1인 개발로 수익화 가능한 최적의 아이디어를 매일 업데이트합니다.
          </p>
        </div>
      </header>

      {/* Trends Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trends.map((trend) => (
            <div
              key={trend.id}
              className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/5 text-zinc-400">
                  {trend.category}
                </span>
                <div className="flex items-center gap-1 text-blue-400">
                  <span className="text-xl font-bold">{trend.score}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Score</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                {trend.title}
              </h3>

              <p className="text-zinc-400 text-sm leading-6 mb-6">
                {trend.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {trend.tags.map(tag => (
                  <span key={tag} className="text-[10px] border border-white/10 px-2 py-0.5 rounded-full text-zinc-500">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase">난이도</span>
                    <span className="text-xs font-medium">{trend.difficulty}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase">수익 잠재력</span>
                    <span className="text-xs font-medium text-emerald-400">{trend.potential}</span>
                  </div>
                </div>
                <button className="text-sm font-semibold py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  분석 보기
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-zinc-600 text-sm">
        <p>© 2026 Trend Scouter. Built by Antigravity AI.</p>
      </footer>
    </div>
  );
}
