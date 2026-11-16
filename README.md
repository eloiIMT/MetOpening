# Met Opening

Met Opening est un jeu d'ouverture de caisses dont les butins sont des œuvres du domaine public issues de l'API du Metropolitan Museum of Art. Le site est disponible en français et en anglais, n'a pas de backend et conserve toutes les données (collection, favoris, pièces) dans le navigateur.

Site en ligne : https://eloiimt.github.io/MetOpening/

## Commandes

- `npm start` : serveur de développement.
- `npm test` : tests de l'application.
- `npm run data:test` : tests des scripts de données.
- `npm run data:index` : génère l'index des œuvres (nécessite le dossier `Specs/` qui n'est pas dans Git).
- `npm run build` : build de production.
- `npm run build:pages` : build pour GitHub Pages sous `/MetOpening/`.

## Structure

- `src/app/core/artworks`, `core/met` : index des œuvres et accès à l'API du Met.
- `src/app/core/game`, `core/collection`, `core/economy` : règles de jeu, collection et favoris, pièces, stock et boutique.
- `src/app/core/i18n` : traductions et service de langue.
- `src/app/shared`, `src/app/pages`, `src/app/layout` : composants partagés, pages et navigation.
- `scripts` : génération de l'index et préparation du déploiement.

## Crédits

Les crédits figurent dans le pied de page du site.
