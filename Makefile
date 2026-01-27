.PHONY: dev new
dev:
	-lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	npx quartz build --serve

new:
	@read -p "Enter file name (without .md): " name; \
	filename="content/$$name.md"; \
	date=$$(date "+%Y-%m-%d %H:%M:%S"); \
	alias=$$(uuidgen | tr '[:upper:]' '[:lower:]'); \
	printf -- "---\ntitle: %s\naliases: %s\ndate: %s\ncard: true\norder:\ntags:\n---\n" "$$name" "$$alias" "$$date" > $$filename; \
	echo "Created $$filename"
