# Validation des améliorations du panneau Admin

La page `/admin` conserve son écran de déverrouillage protégé. Après ouverture, le panneau présente le compteur de codes actifs, l’alerte de code nouvellement créé avec une action de copie, et la liste des codes avec une action de révocation protégée par une modale accessible.

Le parcours de révocation est volontairement explicite : l’annulation ferme la modale sans mutation ; la confirmation appelle la procédure existante de désactivation et rafraîchit la liste. Le code client affiché après création reste limité à cette réponse et la copie utilise l’API Clipboard du navigateur avec un message de succès ou d’échec.

La couverture UI vérifie l’état verrouillé, la transition vers le panneau, la copie du code, le compteur actif, l’ouverture de la modale, l’annulation et la confirmation de révocation.

Le rendu responsive doit être recontrôlé après le build ; aucune donnée client réelle n’est incluse dans cette validation.

Les captures desktop et mobile de `/admin` ont été réalisées après le build. L’écran de déverrouillage reste lisible et sans débordement ; les contrôles du panneau sont organisés pour rester utilisables sur petit écran. La suite complète a validé 49 tests, le typage et le build de production.
## Validation WhatsApp et essai gratuit

Les captures mobile du 26 août 2026 montrent que le formulaire d’essai reste lisible sans débordement et que la page `/admin` conserve un écran de connexion compact et utilisable. Les tests automatisés couvrent la section « Essais gratuits », le lien WhatsApp pré-rempli et la validation des formats de contact. La capture Admin verrouillée ne montre pas les prospects, car cette vue nécessite une session administrateur authentifiée.

## Validation filtres et relances

La capture mobile du 26 août 2026 confirme que Home et l’écran de connexion `/admin` restent lisibles sans débordement après l’ajout du suivi de relance. Les états du tableau Admin, les filtres et la date de dernière relance sont couverts par les tests UI ; la capture verrouillée ne montre pas le tableau, car une session administrateur authentifiée est nécessaire.

## Validation export CSV et conversion rapide

Les captures desktop du 26 août 2026 confirment que Home et l’écran d’accès `/admin` conservent leur mise en page blueprint. Le tableau Admin déverrouillé, l’export CSV et l’action de conversion sont couverts par les tests d’interface ; l’écran verrouillé affiché par capture protège les données tant qu’une session Admin valide n’est pas ouverte.
