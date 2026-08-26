# Validation du parcours protégé

Le parcours serveur a été testé de bout en bout dans `security.integration.test.ts` : une génération sans cookie est refusée avec `UNAUTHORIZED`, le code configuré déverrouille la session via le cookie HTTP-only, puis une génération autorisée appelle le LLM une seule fois et retourne un classeur.

Les limites sont testées dans `security.test.ts`. Les cinq premières générations d’une même fenêtre horaire sont acceptées et la sixième est refusée avec `hourly`. Cinquante générations issues d’identités différentes sont acceptées pour la journée UTC et la cinquante-et-unième est refusée avec `daily`. Les messages tRPC correspondants sont affichés directement dans l’alerte `Génération interrompue` de l’interface via `generate.error.message` : `Limite atteinte : 5 générations par heure.` et `Quota global atteint : 50 générations pour aujourd’hui.`

La capture mobile vérifie l’écran verrouillé, le champ de code, l’annonce des limites, le bouton de génération désactivé et l’absence de débordement horizontal. Le déverrouillage visuel avec saisie manuelle sur appareil réel reste une vérification opérationnelle recommandée avant diffusion publique ; le contrat serveur et l’intégration automatisée sont validés.
