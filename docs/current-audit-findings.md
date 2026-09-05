# Audit de reprise — constats du 5 septembre 2026

## État technique

Le projet est restauré sur le checkpoint `3178b2c3`. Le serveur de développement est opérationnel et TypeScript ne signale aucune erreur. Les journaux récents ne montrent pas d’erreur applicative nouvelle ; seule une recommandation de mise à jour de `baseline-browser-mapping` apparaît.

## Constats visuels desktop

La page d’accueil présente une identité cohérente de bureau d’études : papier chaud, vert technique, laiton, serif éditoriale, références et sections documentaires. L’espace `/etude` est riche et fonctionnel, mais très dense ; la hiérarchie entre les étapes, les champs obligatoires et l’action finale pourrait être plus marquée. `/admin` est lisible, mais son écran d’accès est plus générique que le reste du produit.

## Constats visuels mobile

La page d’accueil est lisible et le CTA principal est visible. Le bouton flottant de contact reste présent et peut réduire l’espace disponible dans le bas de l’écran. Sur `/etude`, le cartouche d’en-tête occupe une grande hauteur avant l’accès au formulaire ; l’utilisateur mobile doit parcourir une longue zone documentaire avant d’atteindre l’action. La priorité d’amélioration est donc l’accès mobile à la génération : ajouter un repère d’étape persistant ou un bouton d’accès rapide sans supprimer les informations de traçabilité.

## Décision de reprise

La prochaine amélioration utile sans nouvelle dépense API est un **mode mobile plus direct dans `/etude`** : repère de progression persistant, bouton « Revenir à l’étape active », et hiérarchie plus nette autour de la checklist et de la génération. Aucun changement de fournisseur IA ni de logique de quota n’est nécessaire pour cette amélioration.

## Contrôle après amélioration mobile

Le repère mobile est présent dans le DOM avec quatre ancres vers l’accès, la description, le contrôle géométrique et la génération. Le rendu global reste cohérent sur 390 px ; la page demeure longue par choix documentaire, mais l’utilisateur dispose maintenant d’un accès direct à l’étape active. La suite complète reste à 123 tests réussis et le build de production réussit avec seulement l’avertissement existant de bundle volumineux.

## Page commerciale et transitions — contrôle final

La page d’accueil mobile conserve un hero lisible avec trois actions : tester l’espace, commencer avec l’exemple et parler du projet. La nouvelle section commerciale est intégrée après le hero avec une proposition prudente, trois repères de valeur et un CTA vers l’étude. L’espace mobile conserve son cartouche technique ; le rail d’étapes reste volontairement plus bas dans la page afin de ne pas surcharger le premier écran. Les transitions utilisent un déplacement doux et basculent automatiquement vers un comportement immédiat lorsque `prefers-reduced-motion` est activé.
