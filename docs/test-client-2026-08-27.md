# Test navigateur client — 27/08/2026

## Périmètre

Test manuel de l’accueil et de l’espace d’étude sur l’URL de prévisualisation, avec contrôle des états visibles, de la checklist et des requêtes réseau. Aucune communication externe, aucun paiement et aucune donnée de production n’ont été modifiés.

## Constats initiaux

L’accueil se charge correctement après un état transitoire « Chargement de l’espace… ». Les appels à l’action sont visibles : tester l’espace, commencer avec l’exemple et ouvrir l’étude. Le bouton d’exemple est présent.

L’espace d’étude se charge correctement et affiche le cartouche technique, le guide en quatre repères, la checklist, les dimensions explicites, les coordonnées client optionnelles, le dépôt de fichier et l’aperçu du livrable.

La session navigateur utilisée possède déjà un accès partagé déverrouillé (`accessType=shared`) ; les champs d’essai gratuit ne sont donc pas visibles dans ce parcours. Une validation totalement vierge nécessite une session navigateur neuve ou la suppression préalable du cookie d’accès, ce qui n’a pas été exécuté pour ne pas perturber la session persistante de l’utilisateur.

Les requêtes observées retournent HTTP 200 et aucun message d’erreur JavaScript n’a été constaté dans les extraits consultés. Le compteur affichait 0/50 pour le quota global quotidien et 5/5 pour le quota horaire au début du parcours.

## Limite de ce rapport

Le classeur n’a pas encore été généré dans cette étape : une génération consomme un quota et nécessite l’utilisation d’un accès ou d’un essai. La génération contrôlée et l’inspection OOXML du fichier restent à effectuer avec une autorisation explicite et un jeu de données fictif.


## Génération de test

Une description fictive complète a été saisie sans fichier joint. La checklist est passée à 4/4 et le bouton de génération a été activé. Le premier clic n’a pas déclenché de requête visible ; après une nouvelle capture et un second clic, le traitement a bien démarré et a affiché la progression « Étape 1/3 — Lecture de la description et du plan… ».

Après environ 20 secondes, la génération s’est arrêtée avec le message utilisateur : « La réponse de l’IA n’est pas un JSON valide. » L’aperçu est resté vide et aucun fichier Excel n’a été disponible au téléchargement. Le compteur visible est resté à 5/5 générations horaires et 0/50 générations quotidiennes dans les requêtes observées ; l’échec n’a donc pas consommé le quota dans ce test.

La requête `estimate.generate` a bien été envoyée sans fichier joint, avec la description et `file: null`. La réponse HTTP est 400, code tRPC `BAD_REQUEST`, avec une erreur serveur localisée à `server/routers.ts:368` : « La réponse de l’IA n’est pas un JSON valide. » Le réseau n’indique pas un timeout ni une erreur de validation du formulaire.

## Défaut bloquant P0

Le parcours client ne produit actuellement aucun classeur lorsque l’IA renvoie une réponse qui échoue au parsing JSON. Comme aucun fichier n’est généré, les feuilles, formules, totaux, hypothèses et formats Excel ne peuvent pas encore être inspectés. Le défaut reproduit le problème historique de parsing JSON ; il faut examiner la réponse brute capturée côté serveur et la requête LLM correspondante avant de corriger.

## Points positifs constatés

L’accueil et l’espace d’étude se chargent. Le guide progresse de 1/4 à 2/4 avec « Suivant ». La checklist détecte correctement la description remplie. Les états de génération sont visibles, le message d’échec est compréhensible et le bouton permet de réessayer. Les requêtes de statut observées retournent HTTP 200.

## Points à corriger ou à revalider

1. P0 — corriger la cause réelle du parsing JSON et retester une génération sans fichier.
2. P1 — vérifier pourquoi le premier clic de génération n’a pas produit de requête visible ; ce comportement peut venir de l’état de capture, mais doit être reproduit.
3. P1 — après correction, générer et télécharger un classeur pour contrôler toutes les feuilles et l’OOXML.
4. P1 — refaire le test avec un PDF ou une image afin d’isoler le chemin fichier joint.
5. P2 — refaire le parcours dans une session totalement neuve pour tester réellement l’essai gratuit, car la session actuelle est déverrouillée par l’accès partagé.

## Seconde tentative après correction du schéma

Après correction de `server/routers.ts`, la checklist est affichée à 4/4 validés et la description fictive est restaurée. Le clic sur « GÉNÉRER MON MÉTRÉ & DQE » a bien été déclenché depuis le repère 4/4. Au dernier contrôle navigateur, l’aperçu restait encore « EN ATTENTE » pendant le traitement ; aucun fichier n’était encore disponible. Le test doit attendre la réponse finale et consulter les logs réseau/serveur avant de conclure.

Constat UX indépendant : le test navigateur en mode preview rend certains éléments interactifs difficiles à atteindre après défilement, mais les boutons de repère restent activables. Cela ne suffit pas à qualifier un défaut de l’application publiée.

Le correctif de schéma est limité à la compatibilité `response_format` : propriétés geometry toutes requises avec valeurs numériques/texte ou null, et geometry requise au niveau racine. Il n’a modifié ni quotas, ni paiements, ni données de production.


## Clarification du second parcours

Le premier clic suivant la correction n’était pas une génération : l’index interactif sélectionné correspondait à « RÉINITIALISER LE FORMULAIRE ». Le formulaire a donc été restauré puis positionné au repère 4/4. Les contrôles courants identifient séparément « RÉINITIALISER LE FORMULAIRE », la zone de description et, plus bas, « GÉNÉRER MON MÉTRÉ & DQE ». Aucun nouveau défaut fournisseur ne peut être conclu avant le vrai clic sur ce dernier bouton.

La correction du schéma a été vérifiée par TypeScript, 112 tests et le build ; la réponse HTTP 400 historique était antérieure au redémarrage du serveur. Le test client réel reste en cours pour obtenir le classeur et inspecter son contenu.


## Génération réelle après le correctif

Le vrai bouton « GÉNÉRER MON MÉTRÉ & DQE » a été activé avec la description fictive sans fichier joint. L’interface affiche correctement « TRAITEMENT SÉCURISÉ EN COURS », l’étape 1/3 puis l’étape 3/3, avec une progression indicative de 33 % à 92 %. La validation JSON est affichée comme terminée ; la construction du classeur est encore en cours au dernier relevé. L’aperçu reste en attente tant que le classeur n’est pas terminé.

Le test confirme que le clic précédent sur l’index 9 correspondait à une réinitialisation et non à une génération ; le clic courant cible bien le bouton de génération identifié comme index 17 lorsque les champs sont visibles.


## Résultat après correction du schéma fournisseur

Le schéma JSON est désormais accepté par le fournisseur : la réponse a été reçue avec un modèle `gpt-5.6-terra`, sans erreur HTTP fournisseur. L’interface a progressé jusqu’à l’étape 3/3 et la validation JSON est affichée comme terminée, mais la génération s’est finalement interrompue avec « Le JSON renvoyé par l’IA ne respecte pas le format attendu. » Aucun classeur n’a été produit et l’aperçu reste indisponible.

Le nouveau défaut est donc distinct du P0 initial : il se situe dans la validation Zod locale du résultat reçu, après réponse fournisseur. Le diagnostic serveur doit être consulté pour connaître les chemins de champs rejetés. Le quota visible reste à 5/5 et 0/50 dans ce parcours ; aucune consommation n’est constatée dans l’interface.


## Génération finalement réussie

Après le correctif de validation tolérante, la génération a abouti : l’interface indique « LIVRABLE PRÊT », « Classeur généré avec 11 postes », quota 4/5 et compteur journalier 1/50. L’aperçu web affiche les onglets Couverture, Métré, DQE, Hypothèses et Contrôles, avec un total général de 0 FCFA car aucun prix unitaire n’était fourni ; les postes non calculables sont explicitement signalés et les lots exclus sont listés.

Le téléchargement a été déclenché depuis « TÉLÉCHARGER », mais le fichier n’est pas apparu dans le dossier `/home/ubuntu/Downloads` du sandbox : le navigateur My Browser utilise un environnement de téléchargement isolé et sa page `chrome://downloads` n’a pas pu être ouverte à ce moment-là. Le contrôle OOXML local du fichier téléchargé n’a donc pas pu être effectué dans cette session.

Défaut P1 visible : après génération réussie, le bandeau d’erreur « Le JSON renvoyé par l’IA ne respecte pas le format attendu » reste affiché en haut alors que le livrable est prêt. L’erreur historique n’est pas nettoyée après succès et peut induire le client en erreur. À corriger par réinitialisation de l’état d’erreur au début et/ou au succès de la mutation.

Défaut opérationnel à vérifier : le quota est passé de 5/5 à 4/5, donc la génération réussie a bien consommé une unité ; les échecs précédents n’avaient pas consommé le quota visible.
