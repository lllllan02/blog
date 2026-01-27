.PHONY: dev
dev:
	-lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	npx quartz build --serve