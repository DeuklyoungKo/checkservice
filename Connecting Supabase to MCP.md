# Connecting Supabase to MCP

This plan outlines the steps to connect your Supabase projects to an MCP-compatible client (like Claude Desktop) using the official Supabase MCP server.

## Proposed Changes

### [Step 1: Get Supabase Access Token]
1.  Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2.  Go to **Account Settings** > **Access Tokens**.
3.  Generate a new token and copy it securely.

### [Step 2: Configure MCP Client (Claude Desktop)]
1.  Open your Claude Desktop configuration file.
    - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
    - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
2.  Add the `supabase` server configuration as follows:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "SUPABASE_PROJECT_REF": "YOUR_PROJECT_REFERENCE_ID"
      }
    }
  }
}
```

### [Step 3: Restart Claude Desktop]
1.  Close and restart the Claude Desktop application to apply the changes.
2.  You should now see the Supabase tools available in the interface.

## Verification Plan

### Manual Verification
- Verify that the Supabase MCP server starts without errors in Claude Desktop.
- Test a simple tool like `get_projects` or `list_tables` within the AI interface.

## 안티그래비티에서 Supabase 사용하기
어플리케이션(프로그램)인 **'안티그래비티(Antigravity)'**에서 Supabase를 사용하시려는 것이군요. 결론부터 말씀드리면, 안티그래비티에서는 %APPDATA%\Claude\claude_desktop_config.json 파일을 수정할 필요가 없습니다.

해당 파일은 오직 Claude Desktop 프로그램 전용 설정 파일이기 때문입니다.

제가(안티그래비티) Supabase와 연동하여 작업을 도와드리기 위해서는, 설정 파일 대신 다음과 같은 방식을 사용하는 것이 더 직접적이고 편리합니다:

프로젝트 내 .env 파일: 프로젝트 루트 폴더에 .env 파일을 만들고 Supabase URL과 Key를 저장해 두시면, 제가 그 정보를 읽어서 데이터베이스 조회나 테이블 생성을 직접 도와드릴 수 있습니다.
Supabase CLI: 터미널에서 supabase 명령어를 통해 작업을 진행할 수 있습니다. 현재 프로젝트에는 아직 설치되어 있지 않은 것 같은데, 필요하시다면 설치부터 도와드릴까요?
코드 작성: 제가 직접 Supabase SDK를 사용하는 코드를 작성하여 데이터를 주고받는 기능을 구현해 드릴 수 있습니다.
추천 드리는 방향: 만약 제가(안티그래비티) 현재 프로젝트의 Supabase 데이터를 직접 조회하거나 관리하길 원하신다면, 다음과 같이 진행해 볼까요?

프로젝트 루트에 .env 파일을 만들고 SUPABASE_URL과 SUPABASE_ANON_KEY를 입력해 주세요. (가이드가 필요하시면 말씀해 주세요!)
그 이후부터는 제가 해당 정보를 바탕으로 테이블 구조를 파악하거나 쿼리를 대신 실행해 드릴 수 있습니다.