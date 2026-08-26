# Audit complet — MÉTREXPERT IA PRO

**Date de l’audit : 26 août 2026**  
**Périmètre :** application web, génération IA, sécurité d’accès, quotas, essai gratuit, administration commerciale, classeur Excel, responsive mobile, performance et préparation à l’usage client.

## Conclusion exécutive

L’application possède déjà une base solide pour un MVP commercial : l’accès est protégé, les quotas sont présents, l’essai gratuit est séparé des abonnements, les fichiers entrants sont contrôlés par signature binaire, le classeur comporte une couverture premium et les tests automatisés couvrent 17 fichiers pour 61 tests réussis au dernier passage. L’identité visuelle est distinctive et cohérente avec le positionnement de bureau d’études.

Cependant, **je ne recommande pas encore de présenter le service comme un outil de métré totalement fiable ou comme un DQE complet sans validation humaine**. Le principal risque n’est plus l’interface : c’est la fiabilité métier et la maîtrise de la consommation API. La génération IA peut encore produire une quantité plausible mais fausse, un prix unitaire nul par défaut, ou un périmètre incomplet sans bloquer suffisamment le livrable. Le second risque important est que les droits sont consommés avant plusieurs validations et avant la réussite de l’appel IA.

## Niveau global de maturité

| Domaine | État constaté | Niveau | Décision recommandée |
|---|---|---:|---|
| Interface et identité | Design blueprint anthracite/or, responsive contrôlé | Bon | Conserver, polir les détails |
| Tests automatisés | 61 tests Vitest réussis, typage et build réussis | Bon pour un MVP | Ajouter des tests de production et d’intégration réelle |
| Accès et administration | Code partagé, codes clients, admin séparé, cookies HTTP-only | Acceptable mais durcissable | Corriger les quotas et ajouter une vraie session admin |
| Génération IA | Prompt strict, parsing défensif, timeout et retries | Correct techniquement | Ajouter validation métier déterministe et reprise contrôlée |
| Fiabilité des quantités | Dépend encore largement de Claude | Insuffisant pour usage contractuel | Mettre un moteur de contrôle et des hypothèses structurées |
| Excel | Couverture premium, Métré et DQE, formules nettoyées | Correct visuellement | Étendre les feuilles et verrouiller le recalcul/contrôle |
| Données personnelles | Contacts conservés pour relance commerciale | À encadrer | Ajouter consentement, rétention et export/suppression |
| Dépendances | `pnpm audit --prod` signale 86 vulnérabilités, dont 25 high et 1 critical | Prioritaire | Mettre à jour et vérifier la compatibilité avant exposition publique |

## 1. Problèmes critiques ou à traiter avant les vrais clients

### P0 — Les droits sont consommés avant la réussite de la génération

Dans `server/routers.ts`, la génération consomme le quota mensuel client et le quota horaire/global avant la validation du fichier joint, la réservation de l’essai gratuit et l’appel IA. Si Claude renvoie une erreur, si le JSON est invalide, si ExcelJS échoue ou si le serveur tombe après l’appel, le client peut perdre une génération sans recevoir de livrable. Pour l’essai gratuit, `reserveFreeTrial` intervient avant l’appel Claude : un échec fournisseur peut donc consommer définitivement l’unique essai.

**Correction recommandée :** introduire une réservation de quota avec état `reserved`, puis confirmer la consommation uniquement après validation IA, validation métier et création du classeur. En cas d’échec, libérer la réservation. Pour éviter les doubles consommations, utiliser un identifiant de requête idempotent et une transaction SQL lorsque c’est possible.

### P0 — Le modèle de données du résultat est trop pauvre pour un vrai métré contrôlable

La réponse ne contient que `projectTitle`, `client`, `location`, `summary`, `currency` et une liste de mesures. Elle ne structure pas les données d’entrée, les dimensions sources, les ouvertures déduites, les hypothèses, les lots inclus/exclus, les niveaux de confiance, les unités sources, ni les contrôles effectués. Ces informations peuvent apparaître dans un texte libre, mais elles ne sont ni vérifiables ni exploitables de manière fiable par l’application.

**Impact :** le résultat peut ressembler à un DQE complet alors qu’il ne couvre que quelques postes décrits par l’utilisateur. Une omission de fondations, ferraillage, déblais, main-d’œuvre, transport ou pertes peut passer inaperçue.

**Correction recommandée :** enrichir le contrat de sortie avec des sections obligatoires `inputs`, `assumptions`, `deductions`, `includedLots`, `excludedLots`, `checks` et `limitations`. Afficher ces sections dans des feuilles Excel séparées et dans la couverture.

### P0 — Les prix ou facteurs absents deviennent silencieusement zéro ou un

`validateEstimate` rend `unitPrice`, `factor` et `notes` optionnels, alors que le schéma JSON strict les demande. Dans `excel.ts`, un prix absent est remplacé par `0` et un facteur absent par `1`. Le total peut donc être numériquement propre mais commercialement faux, sans blocage ni statut explicite « prix à confirmer ».

**Correction recommandée :** distinguer `prix fourni`, `prix estimé`, `prix manquant` et `prix à confirmer`. Interdire un DQE présenté comme final si un prix obligatoire manque, ou afficher le poste dans un total provisoire clairement séparé du total chiffré.

### P1 — Le contrôle des quantités reste principalement délégué à l’IA

Le serveur vérifie que les quantités sont finies et non négatives, mais il ne vérifie pas la cohérence dimensionnelle. Il n’existe pas de moteur indépendant recalculant, par exemple, volume = longueur × largeur × épaisseur, surface de murs moins ouvertures, nombre de poteaux × section × hauteur, ou conversion de cm en m. La normalisation actuelle traite correctement un cas de peinture ambigu, mais elle ne constitue pas encore un contrôle indépendant généralisé.

**Correction recommandée :** créer un moteur de règles par type de poste, avec tolérances, unités canoniques et alertes. Le système doit comparer la quantité IA à la quantité recalculée et marquer toute divergence, sans corriger silencieusement la donnée.

### P1 — Les quotas SQL ne sont pas suffisamment robustes contre les courses concurrentes

La fonction `increment` fait une insertion ou une mise à jour puis lit le compteur. Le contrôle `> HOURLY_LIMIT` intervient après l’incrément. Deux requêtes simultanées peuvent donc dépasser le seuil, et les requêtes refusées continuent d’augmenter les compteurs. Cela ne déclenche pas nécessairement une dépense IA supplémentaire, mais permet de perturber les compteurs et de provoquer un blocage plus long que prévu.

**Correction recommandée :** réaliser une opération atomique « incrémenter seulement si compteur < limite », avec transaction ou requête conditionnelle, et ne compter que les générations effectivement autorisées.

### P1 — L’identification par adresse IP peut être falsifiée selon le proxy

`requestIdentity` privilégie `x-forwarded-for`. Cet en-tête ne doit être accepté que si Express est configuré avec le nombre de proxies de confiance approprié. Sinon, un appelant peut envoyer une fausse adresse IP et contourner la limite par IP.

**Correction recommandée :** configurer explicitement le proxy de confiance de l’environnement de déploiement, utiliser l’adresse normalisée fournie par la plateforme, et compléter la défense par une empreinte de session ou un identifiant de navigateur limité et non sensible.

## 2. Sécurité et données personnelles

Les points positifs sont importants : les codes clients sont stockés sous forme de hash, le code administrateur est distinct, les cookies d’accès sont HTTP-only, les images et fichiers sont validés par type déclaré et signature binaire, et les contenus fournis ne sont pas exécutés. La description est envoyée comme contenu utilisateur dans un message dédié, ce qui limite le risque d’injection directe dans les instructions système.

Les améliorations à prévoir concernent surtout la gouvernance et la défense opérationnelle. Les contacts d’essai stockent téléphone et e-mail en clair en plus de leurs hash, ce qui est pratique pour la relance mais impose une politique de conservation, un consentement explicite et un mécanisme de suppression. Il manque également un bouton de déconnexion/révocation de la session administrateur, une rotation documentée du secret admin et une journalisation d’audit des actions sensibles : création, désactivation, conversion et ouverture WhatsApp.

Le corps Express accepte jusqu’à 50 Mo alors qu’une génération peut déjà transporter un fichier de 8 Mo encodé en base64, deux images de validation et une description. Cette marge est raisonnable pour le fonctionnement mais peut devenir une surface de consommation mémoire sous forte concurrence. Il faut ajouter une limite de concurrence par IP/session, un délai maximal global par requête et une protection contre les demandes répétées.

## 3. IA, parsing et fiabilité

La couche LLM est bien instrumentée : modèle, `max_tokens`, structure des messages et présence d’un fichier sont journalisés avec redaction des URLs de fichiers et d’images. Les erreurs fournisseur conservent le statut, les en-têtes et le body. Le timeout par tentative est de 60 secondes et les retries ciblent les erreurs temporaires. Les tests couvrent désormais les erreurs 400 et les timeouts.

Deux limites subsistent. Premièrement, quatre retries peuvent étendre fortement la durée d’une génération et multiplier la charge sur les erreurs réseau. Il faut afficher un délai estimé, distinguer « fournisseur indisponible » de « données invalides » et éviter toute nouvelle tentative sur les erreurs de schéma ou d’authentification. Deuxièmement, le parsing prend le premier objet JSON complet et tolère les virgules finales. C’est utile en secours, mais un texte parasite ou plusieurs objets dans une réponse peuvent masquer un comportement anormal. En production, il serait préférable de privilégier la sortie structurée du fournisseur, puis de conserver le nettoyage uniquement comme dernier recours avec une alerte de qualité.

Le prompt impose une convention fixe pour la peinture, ce qui améliore la reproductibilité. Cette règle doit être généralisée à toutes les ambiguïtés : pertes, unités, épaisseurs, prix posé/fourniture, main-d’œuvre, taxes et arrondis.

## 4. Classeur Excel et livrable professionnel

La couverture est nettement améliorée : identité du projet, client, coordonnées, prestataire, référence, date, version, devise, résumé financier, avertissement, vérification et zones signature/tampon sont présents. Les feuilles `Métré` et `DQE` utilisent des formules sans signe égal interne et demandent un recalcul automatique.

La limite principale est le périmètre du classeur : il contient aujourd’hui seulement `Couverture`, `Métré` et `DQE`. Pour respecter pleinement la méthode annoncée, il faudrait ajouter au minimum `Données d’entrée`, `Hypothèses`, `Contrôles` et `Notes / exclusions`. La couverture doit aussi afficher le nombre de lots traités et non traités, plutôt que seulement le nombre de postes.

Le classeur utilise deux bibliothèques, `xlsx` puis `exceljs` lorsque des images sont présentes. Cette double réécriture mérite une stratégie de test dédiée, car elle peut modifier styles, résultats calculés, formules ou compatibilité selon le chemin d’exécution. Les formules ont un résultat mis en cache à zéro dans le premier chemin et dépendent du recalcul du logiciel tableur. La validation native Microsoft Excel Desktop n’a pas été possible dans l’environnement ; elle doit être effectuée sur un poste réel avant engagement commercial.

Autre point à corriger : la date de référence et la date d’émission sont générées côté serveur, tandis que la date de validation est un texte libre. Il faut normaliser les dates en ISO au niveau API, puis les afficher localement, afin d’éviter les incohérences de format et de fuseau.

## 5. Parcours Home, Admin, mobile et performance

Le parcours Home est lisible, les états d’accès, de chargement, d’erreur, de quota et d’aperçu sont présents, et les contrôles mobile ont été vérifiés. L’aperçu permet une recherche et indique explicitement « montant filtré », ce qui est honnête et préférable à l’affichage ambigu d’un total général.

Le principal risque de performance est le transport entièrement en base64 : le fichier joint est lu en mémoire dans le navigateur, envoyé dans le corps tRPC, puis le classeur retourné est à nouveau matérialisé en base64 avant création d’une URL temporaire. Sur un téléphone peu puissant ou une connexion instable, cela peut provoquer lenteur, échec réseau ou pression mémoire. Une évolution future devrait utiliser un upload temporaire vers le stockage objet, un identifiant de tâche et un téléchargement séparé.

Le bundle frontend dépasse 500 kB après minification. Ce n’est pas bloquant pour un MVP, mais le découpage de la page Admin, d’ExcelJS/XLSX et des composants rarement utilisés améliorerait le premier chargement mobile. Il faut également mesurer les temps réels sur réseau 3G/4G et ajouter une stratégie de reprise claire pour les téléchargements interrompus.

Dans Admin, les exports CSV sont fonctionnels et adaptés aux besoins de relance. Il serait utile d’ajouter une mention de consentement et une protection contre l’export accidentel de toute la base, ainsi qu’un journal indiquant qui a exporté quoi et quand. Un export combiné ne doit pas être considéré comme un système CRM complet : il manque statut de consentement, source du contact, dernier résultat de relance, prochaine action et historique.

## 6. Dépendances et exploitation

La commande `pnpm audit --prod --audit-level=high` a signalé **86 vulnérabilités : 10 low, 50 moderate, 25 high et 1 critical**. Les sorties identifient notamment `axios@1.12.2`, `image-size@2.0.2`, `nanoid@5.1.6` et une dépendance `form-data` transitive. Le résultat doit être confirmé après mise à jour du lockfile, car les avis peuvent évoluer et certaines alertes peuvent concerner des chemins transitifs non exploités.

Avant publication, il faut créer une branche de mise à jour, exécuter les tests complets, vérifier le build et examiner chaque vulnérabilité high/critical. Il faut également ajouter un contrôle CI qui échoue sur les vulnérabilités critiques et documenter les exceptions justifiées.

Les journaux de développement contiennent des erreurs historiques liées aux essais précédents, notamment des réponses 400, 401, 403, 429 et 500. Les dernières validations automatisées sont réussies, mais une procédure d’exploitation doit définir la différence entre erreur attendue de saisie, refus de quota, erreur fournisseur et erreur interne. Les logs de réponse brute de Claude doivent rester tronqués et redacted en production, avec une durée de conservation limitée.

## Plan d’action recommandé

| Priorité | Travail | Résultat attendu |
|---|---|---|
| 1 | Réservation/confirmation idempotente des quotas et de l’essai | Aucun droit perdu lors d’un échec technique |
| 2 | Schéma métier enrichi avec entrées, hypothèses, lots, exclusions et contrôles | DQE traçable et limites visibles |
| 3 | Moteur indépendant de recalcul des quantités | Détection des incohérences avant livraison |
| 4 | Gestion explicite des prix manquants et des totaux provisoires | Aucun montant nul silencieux |
| 5 | Mise à jour des dépendances high/critical | Surface de risque réduite avant exposition publique |
| 6 | Test réel sur Microsoft Excel Desktop et LibreOffice | Compatibilité du livrable confirmée |
| 7 | Politique données personnelles : consentement, rétention, suppression | Relance commerciale plus conforme et maîtrisée |
| 8 | Upload objet et téléchargement séparé | Meilleure fiabilité sur mobile et gros fichiers |
| 9 | Déconnexion admin, journal d’audit et rotation des secrets | Administration mieux contrôlée |
| 10 | Découpage du bundle et tests réseau mobile réels | Chargement initial plus rapide |

## Verdict de mise en service

**Pour un pilote limité avec validation humaine systématique : oui, sous réserve de traiter immédiatement la consommation des droits en cas d’échec et les dépendances critiques.**

**Pour une promesse commerciale de DQE complet utilisable directement dans un contrat : non, pas encore.** Il faut d’abord structurer les hypothèses et exclusions, ajouter un contrôle indépendant des quantités, rendre les prix manquants visibles et valider le fichier sur Excel Desktop.

La formulation commerciale recommandée reste : « MÉTREXPERT IA PRO prépare une base de métré et de DQE structurée, contrôlable et modifiable, avec assistance IA et vérification humaine requise. » Il faut éviter « calcul garanti », « DQE complet automatique » ou toute promesse de précision sans périmètre défini.

## Références techniques internes

Les constats sont fondés sur l’état du dépôt audité : `server/routers.ts`, `server/security.ts`, `server/_core/llm.ts`, `server/excel.ts`, `server/json.ts`, `server/estimateNormalization.ts`, `client/src/pages/Home.tsx`, `client/src/pages/Admin.tsx`, `drizzle/schema.ts`, les tests Vitest du répertoire `server/` et les journaux `.manus-logs/`. La validation de qualité exécutée pendant l’audit a produit 61 tests réussis, un typage TypeScript réussi et un build de production réussi.

Les résultats d’audit de dépendances proviennent de la commande locale `pnpm audit --prod --audit-level=high` exécutée le 26 août 2026. Ils doivent être réévalués après toute mise à jour des dépendances.
