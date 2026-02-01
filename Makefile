.PHONY: dev doc dir pangu
dev:
	-lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	npx quartz build --serve

pangu:
	npm run pangu

doc:
	@read -p "Enter file name (without .md): " name; \
	$(MAKE) create-file filename="content/$$name.md" title="$$name"

dir:
	@read -p "Enter directory name: " dirname; \
	mkdir -p "content/$$dirname"; \
	$(MAKE) create-file filename="content/$$dirname/index.md" title="$$dirname"

create-file:
	@date=$$(date "+%Y-%m-%d %H:%M:%S"); \
	alias=$$(uuidgen | tr '[:upper:]' '[:lower:]'); \
	printf -- "---\ntitle: %s\naliases: %s\ndate: %s\ncard: true\norder:\ntags:\n---\n" "$(title)" "$$alias" "$$date" > $(filename); \
	echo "Created $(filename)"
