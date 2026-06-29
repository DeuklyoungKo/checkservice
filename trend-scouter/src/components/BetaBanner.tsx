import { IconArchive } from "@tabler/icons-react";

// [동결] 2026-06-29: 실험 종료. 데이터 자동 수집을 중단하고 사이트는 읽기 전용으로 보존한다.
export function BetaBanner() {
    return (
        <div className="w-full bg-muted text-muted-foreground py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-medium z-50 relative border-b">
            <IconArchive size={16} className="flex-shrink-0" />
            <span>
                이 프로젝트는 실험 단계를 마치고 <strong className="text-foreground">데이터 자동 수집을 종료</strong>했습니다.
                기존 분석 데이터는 자유롭게 열람하실 수 있습니다.
            </span>
        </div>
    );
}
