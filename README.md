# 2026 Mandate (Full-width HTML)

## 열어보기 (가장 간단)
- Finder에서 `index.html` 더블클릭 → 브라우저로 열림
- 또는 Chrome/Safari에서 파일 열기: `index.html`

## 보고서(마크다운)
- `report.md`

## “웹처럼” 주소로 열어보기 (선택)
터미널에서 아래 중 하나 실행 후, 안내되는 주소로 접속하세요.

```bash
cd "/Users/onseonghyeon/Desktop/2026"
python3 -m http.server 8000 --directory dist
```

그 다음 브라우저에서 `http://localhost:8000` 접속.

## 글 작성(콘텐츠)
- 글은 `content/posts/` 아래에 **Markdown + YAML frontmatter**로 추가하면 됩니다.
- 예시 파일: `content/posts/2026-01-05-technology-outlook.md`

## 배포 (GitHub Pages 추천)
- 이 폴더를 GitHub 레포로 올리고(default branch를 `main`으로)
- GitHub에서 **Settings → Pages**
  - **Build and deployment**: **GitHub Actions** 선택
- 이후 `main`에 push 할 때마다 `.github/workflows/pages.yml`이 자동으로 배포합니다.

## 배포 (빠른 방법: Netlify / Vercel)
- **Netlify**: 새 사이트 만들기 → 이 폴더(`index.html` 포함) 드래그&드롭
- **Vercel**: New Project → 이 레포 선택 → Build Command 없이 정적 사이트로 배포

## 폭을 “꽉차게” 설정
이미 `index.html`에서 `.max-container`, `.article-body`의 `max-width` 제한을 제거해 전체 폭을 사용하도록 수정되어 있습니다.


