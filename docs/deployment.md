# 작업 폴더와 배포

## Git 저장소

프로젝트 루트는 로컬 `ravirgo` 폴더입니다. `src/`, `public/`, `package.json`이 들어 있는 이 폴더에서 커밋합니다. `git rev-parse --show-toplevel`로 현재 저장소 루트를 확인할 수 있습니다.

원격 저장소는 `https://github.com/Ratenne/ravirgo.git`, 배포 브랜치는 `main`입니다. 사용자가 연결한 사이트는 GitHub 푸시로 자동 배포됩니다. 별도의 GPT Site/Sites 배포를 수행하지 않습니다.

```sh
cd ravirgo
git status
git add .
git diff --cached --stat
git commit -m "Describe the website change"
git push origin main
```

`git add .`는 변경 파일을 커밋 대상으로 선택하는 동작이며, 그 자체로 커밋이나 배포를 수행하지 않습니다. 루트에서 실행하면 이 프로젝트 전체 변경을 선택합니다. `git status`와 `git diff --cached --stat`로 확인한 다음 커밋하면 됩니다. `.gitignore`에 포함된 `node_modules/`, `dist/`, 환경 변수와 개인 작업 기록은 제외됩니다.

## 정적 빌드

- 빌드 명령: `npm run build`
- 출력 디렉터리: `dist`
- 사이트: `https://ravirgo.com`

기존 GitHub 자동 배포 연결을 유지합니다. 소스에는 서버 실행이나 GPT Site 등록이 필요하지 않습니다.
