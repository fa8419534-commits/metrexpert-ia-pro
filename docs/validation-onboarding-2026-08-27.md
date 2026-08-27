# Validation onboarding — 27 août 2026

Le parcours guidé en quatre étapes et la checklist s’affichent correctement dans l’espace de génération en desktop et restent lisibles sur la structure responsive existante. Le bouton « Aide — exemple » est placé au niveau de la description et le brouillon peut être restauré ou effacé.

La section « Abandons du formulaire » est protégée par le rendu Admin et affiche des agrégats calculés à partir des événements réellement présents dans le stockage local du navigateur Admin. Elle ne montre aucun contenu de projet, contact, fichier ou secret. Cette implémentation fournit une visibilité locale à la session Admin ; une consolidation multi-navigateurs nécessiterait ultérieurement une télémétrie serveur anonymisée avec consentement et rétention définie.

Les validations automatisées réalisées avant ce document : 28 fichiers de test, 110 tests Vitest réussis, TypeScript réussi et build de production réussi. Le warning de bundle partagé supérieur à 500 kB reste existant et non bloquant.
