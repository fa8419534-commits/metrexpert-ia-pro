# Validation visuelle — MÉTREXPERT IA PRO

## Direction contrôlée

La page d’accueil a été vérifiée comme une interface de **plan technique de précision** : fond vert anthracite, surfaces de cartouche, accents laiton, texte papier, traits de cotation, repères « REP. » et typographie différenciée entre titres éditoriaux, texte courant et données.

## Vérifications de rendu

| Contexte | Résultat |
| --- | --- |
| Desktop 1280 px | Cartouche lisible, hiérarchie asymétrique stable, panneau de saisie et tableau alignés, contraste or/ivoire maîtrisé. |
| Mobile 390 px | Cartouche empilé, titre et formulaire lisibles, tableau contenu dans une zone de défilement horizontal contrôlée, aucun débordement de page visible. |
| États du MVP | Saisie de description, ajout/suppression de fichier, erreur, progression, génération et téléchargement conservés. |

## Contrôles d’accessibilité minimaux

La page associe le champ de description à son label avec `htmlFor`, expose l’état de succès via `role="status"` et `aria-live="polite"`, fournit une légende masquée et des en-têtes `scope="col"` au tableau, et affiche un anneau de focus visible sur les actions principales. Le conteneur principal masque les débordements accidentels tandis que l’aperçu tabulaire reste consultable horizontalement sur petit écran.

Ces garde-fous sont verrouillés par `server/visual-design.test.ts`, en complément de la vérification visuelle responsive.

## Limite connue

Le tableau présenté dans l’interface est un aperçu structurel cohérent avec le classeur métier. Le contrat backend actuel ne renvoie pas les lignes détaillées du classeur au navigateur ; aucune donnée de génération n’a donc été simulée ou ajoutée au backend pendant cette refonte visuelle.
