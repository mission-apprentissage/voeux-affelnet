install: hooks
	cd server && yarn install --frozen-lockfile
	cd ui && yarn install --frozen-lockfile

start:
	docker-compose up --build --force-recreate

stop:
	docker-compose stop

clean:
	docker-compose down

dataset:
	docker exec voeux_affelnet_server yarn --silent --cwd server cli injectDataset

hooks:
	git config core.hooksPath misc/git-hooks
	chmod +x misc/git-hooks/*

validate:
	cd server && yarn lint
	cd server && yarn test

ci: install
	cd server && yarn coverage
	cd server && yarn lint
