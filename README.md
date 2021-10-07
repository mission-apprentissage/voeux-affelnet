# Voeux Afflenet

Ce repository contient l'application qui permet de transmettre aux CFA les voeux formulés en apprentissage sur Affelnet.
A la réception des voeux, les CFA concernés sont notifiés par email et peuvent se connecter pour les télécharger.

![schema](./misc/doc/voeux-affelnet-fonctionnement.drawio.png)


## Développement

![ci](https://github.com/mission-apprentissage/voeux-affelnet/actions/workflows/ci.yml/badge.svg)
![codecov](https://codecov.io/gh/mission-apprentissage/voeux-affelnet/branch/main/graph/badge.svg?token=CVNNCH0GYA)


### Pré-requis

- Docker 19+
- Docker-compose 1.27+

### Démarrage

Pour lancer l'application :

```sh
make install
make start
```

Cette commande démarre les containers définis dans le fichier `docker-compose.yml` et `docker-compose.override.yml`

L'application est ensuite accessible à l'url [http://localhost](http://localhost)

Il est possible de créer un jeu de données afin de pouvoir tester l'application :

```sh
make dataset
```

Une fois cette commande executée, des emails de création de compte seront disponibles à l'url [http://localhost/smtp](http://localhost/smtp)

![](https://avatars1.githubusercontent.com/u/63645182?s=200&v=4)
