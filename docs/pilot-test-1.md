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
