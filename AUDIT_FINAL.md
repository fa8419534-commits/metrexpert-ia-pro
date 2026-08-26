# Audit final — MÉTREXPERT IA PRO

**Date : 26 août 2026**

## Verdict de préparation

L’application est techniquement plus robuste après cet audit, mais elle ne doit pas être présentée comme une garantie de justesse automatique de chaque métré. Le flux peut servir à des essais encadrés et à des prestations où un contrôle humain est explicitement inclus. Avant un usage client régulier, les deux sujets bloquants restent la **vérification indépendante généralisée des quantités** et la **limitation d’usage/coût du point d’entrée public**.

## Problèmes par ordre de gravité

| Niveau | Problème | État après audit |
|---|---|---|
| Critique | Les quantités produites par le LLM sont contrôlées par schéma et bornes, mais pas recalculées indépendamment pour tous les ouvrages. | **Ouvert — bloquant pour une promesse de DQE automatiquement exact.** |
| Critique | `estimate.generate` est accessible publiquement sans rate limiting ou quota applicatif visible. | **Ouvert — à traiter avant une ouverture commerciale large.** |
| Élevé | Aucun timeout explicite ne protégeait l’appel LLM. | **Corrigé : timeout de 60 s par tentative avec AbortController.** |
| Élevé | Les réponses 400 étaient retentées comme les erreurs transitoires. | **Corrigé : retries conservés pour 408/425/429/5xx et réseau ; les autres statuts retournent immédiatement.** |
| Élevé | Le MIME déclaré pouvait ne pas correspondre aux octets réellement envoyés. | **Corrigé : validation de data URL, décodage, taille binaire maximale de 8 Mo et signatures PDF/PNG/JPEG/WEBP.** |
| Élevé | Les descriptions et documents pouvaient contenir des instructions adversariales destinées au modèle. | **Renforcé : le prompt traite explicitement ces contenus comme des données non fiables et interdit l’exécution ou la modification du contrat JSON.** |
| Élevé | L’audit XLSX ne couvrait pas la feuille Couverture ni les styles des trois feuilles. | **Corrigé : contrôle des trois feuilles, formules XML sans `=`, styles relus et génération recalculable par formules.** |
| Modéré | Les unités restent principalement des chaînes et ne sont pas toutes normalisées par le serveur. | **Ouvert — à traiter dans un contrôle métier indépendant.** |
| Modéré | La progression affichée est indicative et basée sur le temps, non sur des événements backend réels. | **Ouvert — risque UX, pas de corruption de fichier.** |
| Modéré | L’objet URL du téléchargement n’est pas révoqué dans un nettoyage explicite au démontage. | **Ouvert — risque mémoire limité lors de navigations répétées.** |
| Faible | Microsoft Excel Desktop n’est pas installé dans l’environnement. | **Limite documentée : validation XML et relecture bibliothèque réalisées ; ouverture native Excel à faire avant livraison payante.** |

## Audit par domaine

### Calculs et projets variés

Les contrats couvrent désormais des familles de lignes béton, agglos, peinture et DQE ainsi qu’un cas peinture ambigu. La convention serveur est déterministe : un prix de peinture ambigu est traité comme global pour toutes les couches, par exemple 180 m² plutôt que 360 m²-couche pour deux couches, avec un marqueur explicite dans `notes` et `summary`. Un prix explicitement « par couche » est conservé.

Cela ne remplace pas encore un recalcul indépendant de chaque métré réel. Les réponses d’un modèle peuvent contenir une formule plausible mais incorrecte ; cette limite reste le principal risque métier.

### Données manquantes, contradictoires ou mal formulées

Le schéma rejette les quantités négatives, les tableaux vides, les textes trop longs et les structures hors contrat. Le prompt impose des marqueurs de donnée manquante et d’incohérence. En revanche, le serveur ne reconstruit pas encore de manière indépendante les ouvertures, volumes, rendements et conversions d’unités pour toutes les familles d’ouvrages.

### Excel

La feuille **Couverture** dispose maintenant d’un bandeau anthracite, d’un accent or/laiton, de sections identité/résumé/notes, de cellules différenciées, du nom MÉTREXPERT IA PRO mis en avant et d’un avertissement professionnel. Les feuilles **Métré** et **DQE** utilisent les mêmes couleurs sur leurs en-têtes, des cellules de calcul distinctes, des filtres et le gel de la première ligne.

Le contrôle automatisé relit les trois feuilles et confirme sept formules sans signe égal initial : `D2*E2`, `D3*E3`, les références `IFERROR` vers Métré et le total `SUM`. Les styles sont présents sur `Couverture!A1`, `Métré!A1` et `DQE!A1`. La preuve native Microsoft Excel et du recalcul automatique à l’ouverture reste à faire sur un poste équipé d’Excel Desktop. Le fichier contient bien des formules XML propres et des valeurs de cache initiales, mais l’environnement Linux ne permet pas de prouver qu’Excel Desktop recalculera effectivement chaque formule à l’ouverture.

### Mobile

Le rendu mobile a été recontrôlé visuellement à 375 × 812 px. Le formulaire, la zone de dépôt, le bouton de génération et l’aperçu du tableau restent lisibles ; seul le tableau structurel utilise un défilement horizontal contrôlé, sans débordement de la page. Le parcours interactionnel complet — sélection réelle d’un fichier, génération puis téléchargement sur mobile — n’a pas été exécuté de bout en bout dans cet environnement et reste à valider sur appareil réel.

### Réseau et temps d’attente

Le helper LLM journalise le payload redacted et le body fournisseur, applique désormais un timeout par tentative et évite les retries inutiles sur les erreurs 4xx déterministes. Les erreurs réseau et les statuts temporaires continuent d’utiliser un backoff. La couverture de test explicite des timeouts reste à renforcer.

### Sécurité

Les fichiers sont contrôlés côté client et côté serveur. Le serveur vérifie maintenant la structure data URL, le MIME déclaré, les octets initiaux et la taille binaire. Les URL binaires restent redacted dans les logs. La défense contre l’injection de prompt est renforcée dans l’instruction système. Un rate limiting et une authentification/quota restent à décider pour l’exposition publique.

## Validation réalisée

| Contrôle | Résultat |
|---|---:|
| Vitest | 21 tests réussis |
| TypeScript | Réussi |
| Build production | Réussi ; avertissement non bloquant sur la taille d’un chunk frontend |
| Contrôle XLSX programmatique | 3 feuilles, 7 formules, aucun `=` initial, styles présents sur les trois en-têtes |
| Rendu mobile | Revu visuellement à 375 × 812 px ; upload/téléchargement de bout en bout non exécutés |
| Ouverture et recalcul Excel Desktop | Non réalisés dans l’environnement Linux ; formules XML contrôlées uniquement |

## Recommandation de mise en service

Utiliser le livrable uniquement avec une mention de **vérification humaine obligatoire**, des hypothèses visibles et une validation des quantités avant engagement contractuel. Ne pas annoncer un DQE « exact automatiquement » tant que le contrôle indépendant et le rate limiting ne sont pas en place.
