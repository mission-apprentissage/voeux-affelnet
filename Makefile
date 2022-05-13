install: hooks
	yarn --cwd server install --frozen-lockfile
	yarn --cwd ui install --frozen-lockfile

start:
	docker-compose up --build --force-recreate

stop:
	docker-compose stop

clean:
	docker-compose down

dataset:
	docker exec voeux_affelnet_server yarn --silent --cwd server cli db	injectDataset

hooks:
	git config core.hooksPath misc/git-hooks
	chmod +x misc/git-hooks/*

validate:
	yarn --cwd server lint
	yarn --cwd server test

ci: install
	yarn --cwd server coverage
	yarn --cwd server lint
