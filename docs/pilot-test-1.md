# Test pilote n°1 — parcours client

## Scénario retenu
Projet fictif peu sensible : petite maison plain-pied à Yopougon, sans nom de client réel ni coordonnées personnelles.

Description prévue : « Construction d’une maison plain-pied de 90 m² à Yopougon. Prévoir fondations en béton armé, murs en agglos de 15 cm, dalle pleine, toiture légère, enduit intérieur et peinture. Quantifier séparément les fondations, le gros œuvre, la dalle, les enduits et la peinture. Dimensions connues : emprise 10 m × 9 m, hauteur des murs 2,80 m, une porte de 2,10 m² et quatre fenêtres de 1,44 m² chacune. Signaler les hypothèses, les prix unitaires à confirmer et les lots non traités. »

## Données de test
- Contact d’essai : téléphone fictif de test `+225 0700000000`.
- E-mail client fictif : `pilote@example.ci`.
- Client : « Client pilote » uniquement si le formulaire le permet.
- Projet : « Maison plain-pied 90 m² — Pilote 01 ».
- Vérification : aucun fichier sensible joint ; test texte seul d’abord.
- Livrables attendus : classeur XLSX complet, aperçu web, PDF résumé puis contrôle des hypothèses et des quantités.

## Critères de contrôle
1. Le format du contact est accepté et la checklist progresse.
2. La description et les dimensions sont conservées sans modification silencieuse.
3. La génération affiche une progression puis un résultat exploitable ou une erreur explicite.
4. Le total, les unités, les hypothèses, les ouvertures et les lots exclus sont visibles.
5. Le quota d’essai est consommé uniquement si la génération réussit.
6. Le téléchargement Excel/PDF fonctionne et le partage e-mail reste manuel.

## État initial observé
L’accueil publié est accessible sur `metrexpert-qx6adg9a.manus.space`. L’espace `/etude` affiche le guide en quatre étapes, la checklist 0/4, l’accès essai gratuit, les dimensions explicites, l’aperçu du livrable et les options PDF/e-mail. La version mobile du formulaire doit encore être vérifiée pendant ce parcours.

## Étape 1 — accès et contact
Le téléphone `+225 0700000000` et l’e-mail `pilote@example.ci` sont tous deux reconnus par la validation visuelle en temps réel. Après activation du consentement, la checklist passe de 0/4 à 2/4 : contact valide et consentement validé. Aucun message d’erreur observé à cette étape.

## Étape 2 — description et checklist
La description technique du projet pilote a été saisie sans fichier joint. La checklist passe à 4/4 : contact, description détaillée, base de travail et consentement. Aucun avertissement de format ou de longueur n’est apparu.

## Étape 3 — lancement de la génération
La génération a été lancée une seule fois avec la checklist 4/4. L’interface affiche correctement le traitement sécurisé, l’étape 1/3, une progression indicative de 33 %, une estimation d’environ 11 secondes et le bouton désactivé « Génération… ». Aucun double lancement n’est possible pendant l’attente.

## Étape 4 — résultat de la génération
Après environ 20 secondes, la génération échoue avec le message utilisateur : « Le JSON renvoyé par l’IA ne respecte pas le format attendu. » Aucun fichier Excel ni aperçu de résultat n’est produit. Le bouton revient à l’état actif. Le parcours d’interface et le garde-fou de double soumission fonctionnent, mais le livrable ne peut pas encore être contrôlé.

## Pilote n°2 — après correctif
- Version publiée testée : 40f456e9, domaine metrexpert-qx6adg9a.manus.space.
- Contact d’essai distinct utilisé : téléphone fictif +225 0700000001 et e-mail fictif pilote2@example.ci.
- Description sans fichier joint : maison plain-pied de 90 m² à Yopougon, emprise 10,00 × 9,00 m, hauteur 2,80 m, une porte et quatre fenêtres, lots béton/maçonnerie/enduit/peinture.
- Résultat : génération réussie, classeur annoncé avec 5 postes, statut LIVRABLE PRÊT, téléchargement XLSX et aperçu PDF disponibles.
- Contrôle métier visible : surface nette des murs 98,54 m² après déduction de 7,86 m² d’ouvertures ; volumes et prix à 0 lorsque les données indispensables manquent ; mention d’essai gratuit visible.
- Le total affiché est 0 FCFA, cohérent avec l’absence volontaire de prix unitaires ; aucune valeur n’a été inventée.

## Contrôle post-pilote n°2
La version publiée corrigée a généré un classeur avec 5 postes et l’aperçu interactif affichait les onglets Couverture, Métré, DQE, Hypothèses, Géométrie et Contrôles. Le total de 0 FCFA est cohérent avec l’absence de prix unitaires.

Lors de l’ouverture de l’aperçu PDF sur la version précédente, une erreur a été détectée : `WinAnsi cannot encode "" (0x1f534)`, causée par le symbole rouge utilisé dans les observations. Le correctif a remplacé les marqueurs emoji par `[!]`, `[OK]` et `[ATTENTION]`, puis 123 tests ont réussi. Le retest PDF sur la version publiée nécessite toutefois une nouvelle génération, car le résultat précédent n’est pas conservé après rechargement de la page.

## Retest publié du PDF après correctif
La version publiée corrigée est accessible. Un nouveau contact fictif distinct a été saisi (`+225 0700000002`, `pilote3@example.ci`) et les deux formats sont reconnus. Le brouillon conserve la description et le consentement. Une nouvelle génération sera nécessaire pour vérifier l’aperçu PDF et le téléchargement XLSX sur la version corrigée ; elle reste volontairement séparée du pilote n°2 précédent.

Le retest utilise un nouveau téléphone fictif et un nouvel e-mail, avec le brouillon restauré et la checklist affichée à 4/4. La navigation par repères amène bien à l’étape 4/4, mais le bouton de génération reste plus bas dans la page ; aucune génération supplémentaire n’a encore été lancée à ce stade.

La navigation publiée a restauré la checklist 4/4 et le contact du retest, mais le bouton de génération n’est pas exposé dans les éléments interactifs du viewport après les repères ; aucune nouvelle génération n’a donc été déclenchée par erreur.

## Retest PDF publié — résultat
Une nouvelle génération a été lancée une seule fois avec le contact fictif `+225 0700000002` / `pilote3@example.ci`. La génération échoue désormais avant la création du livrable avec le message : « La réponse de l’IA n’est pas lisible. Référence : ec28b972-def1-460a-a023-8597ae8f27a6. » Aucun aperçu PDF ni classeur XLSX n’est disponible. Le correctif WinAnsi n’a pas encore pu être exercé sur un nouveau livrable ; il faut diagnostiquer cette réponse IA et vérifier la restitution du quota associée.
