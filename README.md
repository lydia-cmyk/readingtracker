# 10회독 스티커 트래커 (Vite + React + Tailwind)

이 레포는 사용자의 JSX 컴포넌트를 즉시 GitHub Pages로 배포할 수 있도록 구성되어 있습니다.

## 로컬 실행
```bash
npm i
npm run dev
```
브라우저에서 http://localhost:5173 확인.

## GitHub Pages 배포 (자동)
1. 새 GitHub 레포를 만든 뒤, 이 폴더 전체를 푸시합니다.
2. 레포 **Settings → Pages** 에서 "Build and deployment" 를 **GitHub Actions** 로 설정합니다.
3. `main` 브랜치에 푸시가 되면, `.github/workflows/Deploy Vite to GitHub Pages` 워크플로우가 실행되고 자동으로 배포됩니다.
4. 워크플로우에서 `BASE_PATH`를 `/<repo-name>/` 로 자동 설정하기 때문에, Vite `base` 경로를 따로 손대지 않아도 됩니다.

완료되면 `https://<username>.github.io/<repo-name>/` 로 접속하세요.

## 커스텀 도메인(선택)
- 레포의 **Settings → Pages → Custom domain** 에서 도메인을 연결하면 `CNAME` 파일이 자동 생성됩니다.
- 이후 DNS에 `CNAME` 레코드로 `<username>.github.io` 를 가리키면 됩니다.

## 파일 구조
```
.
├─ public/
├─ src/
│  ├─ App.jsx          # 업로드하신 JSX 코드
│  ├─ index.css        # Tailwind
│  └─ main.jsx
├─ .github/workflows/deploy.yml  # Pages 자동 배포
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
└─ vite.config.js
```
