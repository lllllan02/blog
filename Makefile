.PHONY: dev doc dir card create-file pangu build
dev:
	-lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	npx quartz build --serve

pangu:
	npm run pangu

doc:
	@./clitool new doc

dir:
	@./clitool new dir

card:
	@./clitool new card

create-file:
	@./clitool new doc "$(filename)" --title "$(title)"
