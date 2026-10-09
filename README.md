# Tabi

Carnet de voyage interactif : itinéraire qui se recalcule, fiches illustrées, adresses de locaux, carte, guide et glossaire. Application web installable (PWA), sans serveur.

## Architecture

- `index.html` : coque et chargeur. `?d=<destination>` choisit le pack (par défaut `japon`).
- `app/` : moteur et interface, communs à toutes les destinations.
  - `app.js` moteur d'itinéraire (ordre des villes, jours par ville, journées, horaires) et écrans.
  - `art.js` fiches lieu illustrées, `map.js` cartes Leaflet, `share.js` partage par lien, hors ligne.
  - `scenes.js` illustrations dessinées, utilisées seulement quand une photo manque.
- `packs/<destination>/pack.json` : toutes les données d'une destination (villes, aéroports, lieux, galeries, adresses, guide, glossaire, itinéraires A/B/C).
- `curation/<destination>/` : sources de curation qui servent à construire le pack.
- `tools/build-pack-japon.js` : reconstruit le pack Japon (`node tools/build-pack-japon.js curation/japon`).
- `sw.js` : fonctionnement hors ligne.

## Ajouter une destination

Créer `packs/<id>/pack.json` avec le même schéma que `packs/japon/pack.json`, puis ouvrir `?d=<id>`.

## Données

Images : Wikimedia Commons (auteur et licence affichés sous chaque image). Cartes : © OpenStreetMap, © CARTO. Chaque adresse cite sa source.
Le voyage de chaque personne reste sur son téléphone ; le partage passe par un lien qui contient le voyage, rien n'est stocké sur un serveur.
