.PHONY: all
all: format

.PHONY: format
format:
	npx --yes prettier --write .

.PHONY: run
run:
	npx --yes live-server
