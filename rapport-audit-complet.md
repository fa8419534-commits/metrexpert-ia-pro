# Audit complet actualisé — MÉTREXPERT IA PRO

**Date : 26 août 2026**  
**Périmètre :** page publique, espace `/etude`, `/admin`, authentification, quotas, essai gratuit, génération IA, contrôles géométriques, Excel, PDF, exports CSV, responsive, accessibilité, performance et dépendances.

## Conclusion exécutive

MÉTREXPERT IA PRO est maintenant un **MVP commercial cohérent pour un pilote limité avec validation humaine**. L’application sépare l’accueil public de l’espace de génération, protège les générations par accès et quotas, gère l’essai gratuit, produit un classeur Excel structuré, affiche des contrôles géométriques et conserve un panneau Admin commercial.

La dernière évolution ajoute une navigation fixe, un retour à l’accueil, le défilement fluide, une FAQ et un bouton de thème clair/sombre. Une section de confiance est également présente, mais elle ne fabrique pas de témoignages : elle explique que les retours clients seront publiés uniquement après de vraies prestations et avec accord.

La stabilité technique est bonne au niveau automatisé : **69 tests Vitest réussis**, TypeScript sans erreur et build de production réussi. Le build signale toutefois un bundle JavaScript principal d’environ **1,31 Mo avant gzip**, ce qui mérite une optimisation pour les connexions mobiles. L’audit de production ne signale plus de vulnérabilité high/critical ; il reste **une vulnérabilité moderate liée à `uuid@8.3.2`, transitive via `exceljs@4.4.0`**.

> Décision recommandée : poursuivre avec des prestations pilotes clairement limitées, mais ne pas présenter le fichier comme un DQE contractuel entièrement validé sans relecture humaine et sans test sur Microsoft Excel Desktop.

## Synthèse par domaine

| Domaine | État actuel | Gravité résiduelle | Décision |
|---|---|---:|---|
| Accueil et navigation | `/` public, `/etude` génération, `/admin` administration, header fixe, FAQ, smooth scroll | Faible | Conserver et améliorer le mobile |
| Thème clair/sombre | Bouton disponible dans le header public, préférence persistée | Moyenne | Harmoniser le comportement avec `/etude` et `/admin` |
| Accès et quotas | Codes clients, code partagé, Admin séparé, réservation et restitution | Faible à moyenne | Tester davantage la concurrence SQL en production |
| Essai gratuit | Une génération par téléphone/e-mail normalisé, restitution en cas d’échec technique | Faible | Ajouter consentement et politique de rétention |
| Idempotence | Clé navigateur et verrou serveur temporaire | Faible | Ajouter une persistance idempotente pour les reprises après redémarrage |
| IA et parsing | Prompt strict, nettoyage défensif, timeout, retries et logs redacted | Moyenne | Réduire les retries sur erreurs non temporaires |
| Contrôle géométrique | Linéaire, surface, volume, comptage, tolérance et aperçu éditable | Moyenne | Étendre les règles aux unités BTP et aux ouvertures complexes |
| Excel et PDF | ExcelJS, feuilles Hypothèses/Contrôles/Géométrie, rapport PDF local | Moyenne | Tester sur Excel Desktop et vérifier les impressions réelles |
| Données personnelles | Contacts d’essai conservés pour relance | Moyenne | Ajouter consentement, durée de conservation et suppression |
| Dépendances | Aucun high/critical signalé ; un moderate `uuid` reste | Moyenne | Mettre à jour/remplacer la chaîne compatible ExcelJS |
| Performance | Build réussi, bundle principal important | Moyenne | Code-splitting et chargement différé des modules rares |

## Points corrigés et cohérents

Les quotas et essais ne sont plus consommés définitivement lorsque la validation, l’appel IA ou la création du classeur échoue : le flux de réservation peut libérer le droit. L’idempotence bloque les doubles soumissions simultanées. Ces deux mécanismes sont couverts par les tests de sécurité et de routeur.

Le contrôle géométrique ne remplace pas l’IA par une quantité inventée. Il calcule un résultat indépendant à partir des dimensions explicitement fournies, compare ce résultat à la quantité générée, applique une tolérance et affiche `OK`, `À VÉRIFIER` ou `BLOQUANT`. Les feuilles Excel et l’aperçu web rendent visibles les dimensions, l’écart et la recommandation.

L’accueil public explique désormais le service sans promesse non confirmée. La section « Retours vérifiés » ne contient aucun nom, note ou avis inventé. Cette règle doit rester absolue tant que de vrais témoignages autorisés ne sont pas disponibles.

## Risques prioritaires restants

### P1 — Le mode clair/sombre n’est pas encore totalement uniforme

Le bouton du header public persiste le thème au niveau global, tandis que l’espace `/etude` et l’Admin utilisent encore beaucoup de couleurs techniques codées directement dans les classes et dans `index.css`. En pratique, le mode sombre est surtout conçu pour l’accueil ; le changement de thème peut donc produire une expérience partiellement différente sur les routes internes.

**Action recommandée :** décider explicitement entre un thème global cohérent sur les trois routes ou un thème limité à la vitrine. La solution la plus sûre à court terme est de limiter le bouton à l’accueil et de conserver `/etude` et `/admin` en thème blueprint sombre fixe, ou bien de convertir progressivement les couleurs hardcodées en variables CSS partagées.

### P1 — Le contrôle métier ne peut pas garantir un DQE complet

Le moteur vérifie les postes et dimensions qui existent dans les données reçues. Il ne peut pas prouver qu’un lot absent du descriptif — fondations, ferraillage, déblais, transport, main-d’œuvre ou équipements — devait être inclus. Le classeur doit donc continuer à distinguer clairement lots traités, lots exclus, données manquantes et prix à confirmer.

**Action recommandée :** ajouter une checklist de périmètre à confirmer avant téléchargement et bloquer l’étiquette « complet » lorsqu’un lot critique n’a pas été déclaré.

### P1 — Validation native Microsoft Excel Desktop non réalisée

Les tests automatisés vérifient la structure XLSX, les formules, les feuilles, les images et la génération. Ils ne remplacent pas l’ouverture dans Excel Desktop sur Windows avec recalcul automatique, impression, images de signature et formules dans toutes les feuilles.

**Action recommandée :** ouvrir plusieurs classeurs de test dans Excel Desktop, recalculer, imprimer en PDF et comparer les totaux avec le moteur indépendant.

### P1 — Transport base64 et pression mémoire

Le plan, les images de signature et le classeur circulent principalement en base64. Ce choix simplifie le MVP mais augmente la taille des requêtes et la pression mémoire du navigateur et du serveur, surtout sur mobile ou sous plusieurs générations simultanées.

**Action recommandée :** passer ultérieurement par un upload temporaire vers le stockage objet, puis transmettre un identifiant de fichier au serveur au lieu de transporter systématiquement les octets dans le payload tRPC.

### P2 — Bundle frontend trop volumineux

Le build signale un chunk JavaScript principal d’environ 1,31 Mo avant gzip, au-dessus du seuil de 500 kB recommandé par Vite. L’application reste fonctionnelle, mais le premier chargement peut être lent sur des réseaux mobiles.

**Action recommandée :** charger `/admin`, `exceljs` côté serveur uniquement, les contrôles rarement utilisés et les dialogues lourds à la demande ; mesurer ensuite le temps de chargement sur un réseau 3G/4G simulé.

### P2 — Vulnérabilité moderate transitive

L’audit de production signale `uuid@8.3.2` via `exceljs@4.4.0`, avec une correction annoncée à partir de `uuid@11.1.1`. Une mise à jour forcée doit être testée avec prudence, car ExcelJS peut dépendre d’une API ou d’une résolution de version particulière.

**Action recommandée :** vérifier la version ExcelJS disponible, tester une mise à jour compatible ou isoler ExcelJS côté serveur. Ne pas masquer l’avis par une exception sans documenter pourquoi le chemin est non exploitable.

### P2 — Configuration pnpm vieillissante

Le build affiche que les champs `pnpm.patchedDependencies` et `pnpm.overrides` présents dans `package.json` sont ignorés par les versions récentes de pnpm. Une règle de sécurité ou de résolution placée uniquement dans ces champs peut donc ne pas être appliquée.

**Action recommandée :** migrer ces réglages vers le fichier de configuration pnpm attendu par la version utilisée, puis vérifier le lockfile et l’audit dans une installation propre.

### P2 — Données de prospection et consentement

Les contacts d’essai sont utiles pour la relance WhatsApp et les exports CSV, mais le système ne doit pas supposer que le simple renseignement d’un numéro autorise toute relance commerciale. Il faut enregistrer la source, le consentement, la date de conservation, le statut de désinscription et une procédure de suppression.

**Action recommandée :** ajouter un consentement explicite au formulaire d’essai et un statut « ne plus contacter » dans Admin.

## Audit des parcours

| Parcours | Résultat | Observation |
|---|---|---|
| Découverte `/` → `/etude` | Cohérent | CTA, navigation fixe et bouton retour fonctionnels |
| Essai gratuit | Cohérent | Téléphone/e-mail validé en temps réel, limite par contact |
| Client payant | Cohérent | Code, quota mensuel, progression et message d’épuisement |
| Génération avec fichier | Protégé | Taille, type déclaré et signature binaire contrôlés |
| Double clic / retry | Protégé | Clé idempotente et verrou temporaire |
| Échec IA / Excel | Protégé | Restitution de réservation prévue par le flux serveur |
| Aperçu géométrique | Opérationnel | Édition, validation, filtrage, tri et export PDF |
| Admin commercial | Opérationnel | Codes, essais, conversion, WhatsApp et CSV |
| Mobile | Acceptable | Contrôle responsive réalisé ; génération longue à tester sur appareil réel |

## Vérifications exécutées

Les résultats disponibles pour cette évolution sont les suivants : **69 tests Vitest réussis sur 19 fichiers**, TypeScript sans erreur et build de production réussi. Les captures responsive de `/` et `/etude` ont été réalisées en mobile. L’audit de production des dépendances ne signale plus de vulnérabilité high ou critical, mais conserve l’avis moderate `uuid` décrit ci-dessus.

Les erreurs historiques de transformation Express visibles dans certains journaux ne correspondent pas au dernier build validé ; elles doivent toutefois être nettoyées ou archivées pour éviter de confondre une ancienne erreur avec une anomalie actuelle.

## Plan d’action recommandé

| Priorité | Action | Critère de sortie |
|---|---|---|
| 1 | Décider et harmoniser la portée du thème clair/sombre | Accueil et routes internes cohérents ou thème explicitement limité à `/` |
| 2 | Tester les classeurs dans Excel Desktop | Formules, images, impression et totaux validés |
| 3 | Ajouter consentement et rétention des contacts | Contact supprimable, désinscription et durée documentées |
| 4 | Traiter `uuid` et migrer la configuration pnpm | Audit propre ou exception documentée et justifiée |
| 5 | Ajouter checklist des lots et blocage du terme « complet » | Périmètre inclus/exclus confirmé avant téléchargement |
| 6 | Réduire le bundle et le transport base64 | Chargement et génération mesurés sur réseau mobile |

## Décision finale

L’application peut être utilisée pour des **tests encadrés et des prestations pilotes limitées**, à condition de préciser le périmètre, de vérifier humainement les résultats et de ne pas présenter un calcul partiel comme un DQE complet. Avant une commercialisation plus large, les priorités sont la validation Excel Desktop, la gouvernance des contacts, la cohérence du thème, le traitement de la vulnérabilité moderate et l’optimisation du chargement mobile.
