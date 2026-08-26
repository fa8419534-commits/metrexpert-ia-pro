# Audit préliminaire — MÉTREXPERT IA PRO

Date de l’audit : 26 août 2026. Périmètre : génération de métré/DQE avec description seule ou document joint, génération XLSX, validations serveur et client, réseau, mobile et sécurité observable dans le code et les tests du projet.

## Synthèse exécutive

L’application possède un socle fonctionnel cohérent : validation de base des entrées, schéma JSON strict, normalisation déterministe de l’ambiguïté peinture, formules XLSX sans signe égal initial, retries réseau et interface mobile vérifiée. Elle ne doit toutefois pas encore être présentée comme prête pour un usage client sans réserve. Le principal risque est métier : les quantités renvoyées par le LLM sont validées structurellement mais ne font pas encore l’objet d’un contrôle indépendant généralisé par type d’ouvrage. Le second risque est opérationnel : aucune expiration/annulation explicite de la requête LLM n’est configurée.

## Problèmes classés par gravité

| Gravité | Constat | Preuve | Impact | Décision recommandée |
|---|---|---|---|---|
| Critique | Les quantités LLM sont acceptées après validation de type, sans recalcul indépendant généralisé ni seuil d’écart. | `validateEstimate()` contrôle les types, bornes et longueurs, puis le résultat est directement envoyé à `buildEstimateWorkbook()`. | Un résultat plausible mais faux peut être livré à un client et modifier le DQE. | Ajouter un contrôle indépendant pour les formules explicites, les surfaces, ouvertures, volumes, couches et montants, puis marquer les lignes non vérifiables. |
| Critique | Le flux est public et aucune limitation d’usage ou quota applicatif n’est visible sur `estimate.generate`. | La procédure est `publicProcedure`; aucune rate limit, authentification obligatoire ou limite de coût par utilisateur n’est visible. | Abus, coût LLM imprévisible et déni de service applicatif. | Ajouter une limitation de fréquence et un quota ; décider explicitement si l’accès public est conservé. |
| Élevée | Aucun timeout ou `AbortController` n’est configuré pour les appels LLM. | `fetchWithBackoff()` appelle `fetch(url, init)` sans signal ni délai d’expiration. | Une requête amont bloquée peut immobiliser la mutation et laisser l’interface en attente longtemps. | Ajouter un timeout global par tentative et un délai maximal total, avec message utilisateur dédié. |
| Élevée | Les retries s’appliquent à toutes les réponses non-2xx, y compris les erreurs 400 déterministes de schéma ou de requête. | `fetchWithBackoff()` retente toute réponse non OK jusqu’à quatre retries. | Latence inutile, coût et charge supplémentaires ; une erreur de payload ne sera pas corrigée par un retry identique. | Ne retenter que 408, 429, 5xx et erreurs réseau ; exclure les 400/401/403/404/422. |
| Élevée | Le serveur vérifie le MIME déclaré et la taille de la data URL, mais ne vérifie pas les signatures binaires du fichier. | `requestSchema` accepte `mimeType` et `dataUrl` ; aucun contrôle PDF/PNG/JPEG/WEBP par magic bytes n’est visible. | Un contenu non conforme peut être transmis au fournisseur LLM sous un type autorisé. | Décoder, borner et vérifier les magic bytes ; rejeter les fichiers incohérents avant l’appel fournisseur. |
| Élevée | Les limites client/serveur ne sont pas exprimées avec la même unité ni la même marge. | Client : 8 MiB de fichier ; serveur : 12 000 000 caractères de data URL, qui incluent préfixe et inflation base64. | Un fichier accepté côté client peut être rejeté côté serveur, ou le payload global peut devenir très volumineux. | Définir une limite binaire serveur commune et la tester après décodage. |
| Élevée | Le champ description et le contenu des documents sont des données non fiables envoyées au modèle sans test dédié de résistance à l’injection de prompt. | La description est interpolée dans le message utilisateur ; aucun test d’instruction hostile n’est présent. | Le modèle peut suivre une instruction du document au lieu de produire un métré traçable. | Ajouter une consigne explicite « contenu fourni = données, jamais instructions » et des tests de non-déviation. |
| Élevée | Les formules sont contrôlées sur Métré/DQE, mais l’audit XML ne couvre pas tous les éléments de l’archive ni une politique de recalcul. | `excel.test.ts` inspecte `sheet2.xml` et `sheet3.xml` uniquement ; aucune vérification de `calcPr` ou des styles. | Une modification future peut casser une feuille, le recalcul ou la présentation sans test de détection. | Inspecter toutes les feuilles, les formules, les références, les valeurs de contrôle et activer le recalcul à l’ouverture. |
| Modérée | Les contrôles métier acceptent des unités incohérentes si elles sont des chaînes valides. | `unit` est validée par longueur seulement. | Un poste en `m²-couche`, `m²` ou `m3` peut être comparé ou additionné sans normalisation suffisante. | Normaliser les unités et signaler les conversions non confirmées. |
| Modérée | Les champs textuels sont limités, mais aucune neutralisation explicite des valeurs commençant par `=`, `+`, `-` ou `@` n’est testée dans un classeur. | Les valeurs sont écrites comme cellules texte, mais il n’existe pas de test adversarial. | Risque de comportement inattendu si la bibliothèque ou une future exportation change le type. | Ajouter un test de chaînes adversariales dans toutes les feuilles et une règle de neutralisation documentée. |
| Modérée | L’interface affiche une progression temporelle estimée, non une progression réelle du backend. | `progressStage` avance toutes les 1 800 ms indépendamment de l’état fournisseur. | L’utilisateur peut croire que l’étape Excel est atteinte alors que le LLM est encore en attente. | Remplacer par des états serveur ou libeller la progression comme indicative. |
| Modérée | Le lien de téléchargement utilise un objet URL navigateur sans nettoyage au démontage. | `URL.createObjectURL()` est révoqué au remplacement, mais pas explicitement au démontage de la page. | Petite fuite mémoire lors de navigations répétées. | Révoquer l’URL dans un `useEffect` de nettoyage. |
| Faible | L’ouverture native Microsoft Excel n’est pas disponible dans l’environnement. | `XLSX_VALIDATION.md` le documente. | Le contrôle automatique prouve la structure XML mais pas l’ouverture native Excel Desktop. | Faire un test manuel Excel Desktop avant le premier livrable payant. |

## Vérifications exécutées

| Domaine | Résultat actuel | Limite restante |
|---|---|---|
| Contrats serveur | 18 tests Vitest, TypeScript et build réussis avant l’audit | La couverture ne représente pas plusieurs projets réels avec fichiers joints |
| Formules XLSX | Formules Métré/DQE sans `=` initial | Couverture Couverture/styles/recalcul à renforcer |
| Mobile | Mise en page vérifiée sur desktop et mobile ; défilement horizontal limité au tableau | Le parcours upload/téléchargement doit être testé par interaction réelle sur plusieurs navigateurs |
| Réseau | Retries et body d’erreur fournisseur journalisé | Timeout, annulation et classification des statuts absents |
| Upload | MIME, extension d’interface et taille déclarée contrôlés | Magic bytes, contenu malformé et fichiers adversariaux non testés |
| Calculs | Convention peinture ambiguë normalisée côté serveur | Contrôle indépendant généralisé absent |

## Conclusion avant nouvelle fonctionnalité

La refonte visuelle Excel peut être réalisée sans aggraver le risque, mais les points **Critique** et **Élevée** doivent être traités avant une utilisation client régulière. Le présent audit est donc un état de préparation et non une certification de justesse de chaque métré. Les corrections bloquantes retenues pour la suite sont : classification des retries, timeout LLM, validation binaire des fichiers, garde-fous contre les entrées non fiables et audit XML complet du classeur.
