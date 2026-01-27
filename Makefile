.PHONY: dev new
dev:
	-lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	npx quartz build --serve

new:
	@read -p "Enter file name (without .md): " name; \
	filename="content/$$name.md"; \
	date=$$(date "+%Y-%m-%d %H:%M:%S"); \
	alias=$$(uuidgen | tr '[:upper:]' '[:lower:]'); \
	printf -- "---\ntitle: %s\naliases: %s\ntags:\ndate: %s\norder:\n---\n" "$$name" "$$alias" "$$date" > $$filename; \
	echo "Created $$filename"
