.PHONY: dev doc dir card create-file pangu build
dev:
	-lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	npx quartz build --serve

pangu:
	npm run pangu

doc:
	@./clitool doc

dir:
	@./clitool dir

card:
	@./clitool card

create-file:
	@./clitool create-file "$(filename)" "$(title)"
