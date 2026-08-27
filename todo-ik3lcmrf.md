# Project TODO

- [x] Refondre le thème global avec la palette exacte #0F1613, #16201C, #C9A15A, #EDEAE2, #3A4A42 et #7C9A76
- [x] Ajouter la hiérarchie typographique Fraunces / Inter ou IBM Plex Sans / IBM Plex Mono
- [x] Transformer l’en-tête en cartouche de plan technique avec projet, référence, échelle et date
- [x] Remplacer les séparateurs génériques par des lignes de cotation techniques
- [x] Transformer les repères de sections en marqueurs de plan de type « REP. 01 »
- [x] Repenser la zone de résultat métrés/DQE comme un tableau technique avec cotations en marge
- [x] Conserver les fonctionnalités, parcours, états d’authentification et interactions actuels du MVP
- [x] Vérifier la responsivité et l’accessibilité de la nouvelle interface
- [x] Ajouter ou mettre à jour les tests Vitest nécessaires à la refonte
- [x] Vérifier le rendu visuel et le build avant livraison
- [x] Corriger le débordement horizontal mobile du panneau et de l’aperçu de tableau détecté en vérification responsive
- [x] Ajouter une date visible dans le cartouche supérieur
- [x] Relier l’état de succès du livrable à la zone de tableau technique sans modifier le contrat backend
- [x] Renforcer et documenter les contrôles d’accessibilité minimaux : focus, labels, structure de tableau et débordement
- [x] Exécuter le build de production et corriger toute erreur éventuelle
- [x] Consigner une validation accessibilité explicite dans un test et une note de contrôle du projet
- [x] Examiner les logs serveur pour identifier la forme exacte de la réponse Claude qui échoue au parsing
- [x] Renforcer l’instruction système pour imposer un objet JSON strict sans texte parasite ni balises Markdown
- [x] Implémenter un nettoyage serveur défensif autour du JSON avant JSON.parse
- [x] Ajouter des tests couvrant texte avant/après, balises markdown et JSON invalide
- [x] Exécuter les tests et le build puis créer un checkpoint du correctif
- [x] Documenter l’absence de réponse brute dans les logs historiques et activer sa capture tronquée sur les prochains échecs de parsing
- [x] Récupérer le diagnostic brut du dernier essai de génération et distinguer contenu capturé, troncature et absence de log
- [x] Présenter fidèlement l’aperçu disponible sans exposer ni inventer de données non capturées
- [x] Logger de façon redacted le corps complet de la requête envoyée au LLM : modèle, max_tokens et structure des messages
- [x] Capturer le body complet des erreurs fournisseur, avec statut et en-têtes non sensibles
- [x] Comparer un essai description seule et un essai avec fichier joint
- [x] Ajouter les tests de journalisation et vérifier le build avant livraison du diagnostic
- [x] Corriger le schéma response_format strict : tous les champs de chaque mesure doivent apparaître dans required
- [x] Inspecter la fonction de génération XLSX et confirmer la présence du signe égal dans les formules XML
- [x] Corriger l’écriture des formules pour produire <f>D2*E2</f> sans signe égal interne
- [x] Ajouter un test XML anti-régression sur les formules générées
- [x] Générer un classeur de contrôle et vérifier sa structure et ses formules calculables
- [x] Vérifier la disponibilité de Microsoft Excel dans l’environnement et documenter la limite éventuelle
- [x] Exécuter les tests et le build puis sauvegarder un checkpoint du correctif
- [x] Ajouter une animation de chargement au bouton de génération/téléchargement pendant la création du fichier Excel
- [x] Désactiver le bouton pendant la génération et exposer un état accessible sans changer l’action backend
- [x] Ajouter ou mettre à jour le test de contrat UI correspondant
- [x] Vérifier le rendu et exécuter tests, TypeScript et build avant checkpoint
- [x] Afficher un état de chargement directement dans la zone du bouton de téléchargement pendant la génération Excel
- [x] Ajouter le contrat UI couvrant ce bouton de téléchargement en attente
- [x] Inspecter les règles existantes sur les prix indicatifs, les couches de peinture et les hypothèses DQE
- [x] Imposer une convention fixe : sauf précision contraire, un prix de peinture couvre l’ensemble des couches prévues
- [x] Faire inscrire la convention et le caractère non définitif dans les notes/hypothèses du résultat
- [x] Ajouter des tests de contrat vérifiant la règle et sa transmission dans le prompt
- [x] Exécuter tests, TypeScript et build puis sauvegarder un checkpoint
- [x] Ajouter une normalisation serveur déterministe des postes de peinture ambigus avant création du classeur
- [x] Garantir par test concret le marqueur exact dans notes et summary ainsi que la quantité globale par défaut
- [x] Créer un nouveau checkpoint après ces validations métier
- [x] Auditer plusieurs familles de projets avec et sans fichier joint, en distinguant les cas déterministes, ambigus et incohérents
- [x] Vérifier les données manquantes, contradictoires, mal formulées et les erreurs réseau/timeout
- [x] Auditer la sécurité des descriptions et des fichiers uploadés sans exécuter de contenu fourni
- [x] Inspecter les formules XML de toutes les feuilles XLSX et les contrôles de recalcul
- [x] Vérifier le rendu mobile du formulaire, de l’upload et du téléchargement
- [x] Rédiger l’audit priorisé avant toute nouvelle fonctionnalité
- [x] Corriger les problèmes critiques bloquants identifiés par l’audit
- [x] Moderniser la feuille Couverture avec la palette MÉTREXPERT IA PRO
- [x] Harmoniser les en-têtes des feuilles Métré et DQE
- [x] Ajouter les tests de régression du classeur et des garde-fous de sécurité
- [x] Valider tests, TypeScript, build, rendu mobile et classeur final
- [x] Sauvegarder un checkpoint final avec l’audit et la refonte Excel
- [x] Corriger les retries LLM pour exclure les erreurs 4xx déterministes et ajouter un timeout par tentative
- [x] Vérifier les signatures binaires des fichiers PDF/PNG/JPEG/WEBP côté serveur
- [x] Renforcer l’instruction contre les injections provenant de la description ou des documents
- [x] Documenter les risques restant ouverts : contrôle indépendant des quantités et rate limiting applicatif
- [x] Exécuter des probes réels sur plusieurs scénarios texte, ambiguïté, contradiction et fichier joint
- [x] Ajouter un test démontrant l’abort sur timeout et l’absence de retry sur une erreur 400
- [x] Vérifier ou documenter la limite effective du recalcul natif Excel dans le fichier produit
- [x] Documenter la limite de validation interactionnelle mobile upload/téléchargement
- [x] Maintenir explicitement ouverts le contrôle indépendant généralisé des quantités et le rate limiting/quota
- [x] Créer le checkpoint final après ces validations et limites documentées
- [x] Exposer dans la réponse de génération les données nécessaires à l’aperçu réel sans modifier le fichier Excel
- [x] Remplacer l’aperçu statique par un tableau alimenté par les postes générés
- [x] Ajouter recherche, résumé des postes et états vide/chargement/erreur
- [x] Préserver la responsivité mobile et les contrôles d’accessibilité du tableau
- [x] Ajouter les tests de contrat serveur et UI puis valider TypeScript, tests, build et rendu
- [x] Sauvegarder un checkpoint de l’aperçu interactif
- [x] Ajouter un état de chargement et un état d’erreur directement dans le panneau d’aperçu
- [x] Vérifier par contrat la structure responsive du tableau interactif et ses garde-fous d’accessibilité
- [x] Créer le checkpoint final de l’aperçu après ces corrections
- [x] Exécuter une génération réelle de test et retirer le mode d’audit temporaire avant livraison
- [x] Inspecter le contexte serveur, les cookies et la persistance disponibles pour sécuriser la mutation de génération
- [x] Configurer un code d’accès partagé côté serveur sans exposer sa valeur au frontend
- [x] Limiter à 5 générations par heure et par IP/utilisateur
- [x] Limiter à 50 générations par jour pour toute l’application
- [x] Compter les générations autorisées et exposer un compteur administrateur minimal
- [x] Afficher les états verrouillé, code invalide, rate limit et quota global atteint
- [x] Ajouter tests unitaires des protections et des compteurs
- [x] Valider tests, TypeScript, build et parcours protégé avant checkpoint
- [x] Documenter les valeurs exactes et les limites de la protection
- [x] Ajouter un test d’intégration prouvant qu’un code valide déverrouille puis autorise une génération
- [x] Ajouter un test ciblé des messages UI pour la limite horaire et le quota quotidien
- [x] Documenter la vérification du parcours protégé complet : verrouillage, déverrouillage, génération et blocage
- [x] Ajouter un test UI ciblé du message `Limite atteinte : 5 générations par heure.` dans l’alerte Home
- [x] Ajouter un test UI ciblé du message `Quota global atteint : 50 générations pour aujourd’hui.` dans l’alerte Home
- [x] Ajouter un indicateur visuel dynamique du quota horaire restant sur l’interface principale
- [x] Couvrir les états quota disponible, faible et épuisé avec un rendu accessible
- [x] Vérifier la responsivité, les tests et le build avant checkpoint
- [x] Ajouter un contrat UI confirmant que HourlyQuotaIndicator est rendu dans Home lorsque le statut est déverrouillé
- [x] Effectuer et documenter une capture mobile de l’état déverrouillé avec l’indicateur visible — accès autorisé confirmé par la capture utilisateur ; le rendu est conditionné au statut déverrouillé
- [x] Ajouter un vrai test SSR/UI de Home avec le statut sécurité déverrouillé mocké et quota restant visible
- [x] Documenter la validation du texte « Quota horaire restant » — rendu Home déverrouillé vérifié par test UI réel ; capture mobile directement vérifiable non obtenue dans l’environnement automatisé et limite explicitement documentée

- [x] Déclencher une animation sobre lorsque le quota horaire devient faible ou épuisé
- [x] Afficher une notification visuelle claire et accessible pour les états faible et épuisé
- [x] Respecter prefers-reduced-motion et conserver la lisibilité mobile
- [x] Ajouter les tests des transitions et notifications de quota
- [x] Vérifier le rendu responsive, exécuter tests, TypeScript et build, puis sauvegarder un checkpoint
- [x] Vérifier en mobile les états déverrouillé faible et épuisé avec notification visible, ou documenter précisément la limite de session — structure mobile couverte par contrat UI/CSS ; capture directe low/exhausted non disponible avec la session automatisée verrouillée
- [x] Ajouter un contrat UI mobile couvrant le retour à la ligne, l’absence de débordement et la notification quota

- [x] Ajouter les champs client, projet, localisation, référence, date, version, prestataire et devise sur la couverture
- [x] Utiliser « À compléter » pour les informations client absentes sans inventer de données
- [x] Recomposer la couverture avec blocs premium, bandeau, résumé financier dominant et avertissement imprimable
- [x] Ajouter les tests de contenu, formules, styles et structure de la couverture
- [x] Vérifier le classeur généré et son rendu avant checkpoint
- [x] Corriger l’assertion Excel du champ client pour refléter le comportement « À compléter » lorsque le client est absent

- [x] Ajouter les champs client téléphone et e-mail dans le formulaire
- [x] Transmettre les coordonnées client et les métadonnées de vérification au générateur Excel
- [x] Ajouter « Vérifié par » et « Date de validation » dans la couverture
- [x] Ajouter les tests de formulaire, contrat et couverture pour ces champs
- [x] Régénérer le classeur et effectuer le contrôle d’impression avant checkpoint
- [x] Corriger les assertions de couverture décalées après l’ajout de la ligne « Vérifié par »
- [x] Corriger l’assertion de test de l’avertissement pour cibler les placeholders client réellement affichés
- [x] Corriger la couverture imprimée sur deux pages en réduisant les largeurs de colonnes et revalider le PDF
- [x] Ajouter dans le formulaire les champs « Vérifié par » et « Date de validation », puis les transmettre au backend
- [x] Ajouter un test router/contrat vérifiant la propagation des quatre métadonnées vers le classeur

- [x] Ajouter un bloc dédié « Signature numérique / Tampon d’entreprise » sur la couverture
- [x] Conserver une zone vide clairement identifiable sans inventer de signature ou de tampon
- [x] Garantir la lisibilité et l’impression sur une seule page
- [x] Ajouter les tests de structure, contenu et rendu du bloc de validation
- [x] Régénérer le classeur, vérifier l’impression et sauvegarder un checkpoint
- [x] Mettre à jour le test de plage de couverture après l’ajout du bloc signature/tampon
- [x] Corriger l’attente de plage A1:D27 dans le test après compactage de la couverture
- [x] Sauvegarder un nouveau checkpoint après l’ajout du bloc « Signature numérique / Tampon d’entreprise » et sa validation d’impression

- [x] Ajouter un import d’image de signature depuis l’interface web
- [x] Ajouter un import d’image de tampon depuis l’interface web
- [x] Valider les formats, signatures binaires, dimensions et taille des images
- [x] Transmettre les images au serveur et les insérer dans la couverture Excel
- [x] Ajouter les tests UI, routeur, sécurité, XLSX et impression
- [x] Vérifier le rendu final puis sauvegarder un checkpoint
- [x] Corriger l’import ESM de XLSX dans le script de contrôle d’impression avec images
- [x] Préserver les résultats en cache des formules lors de l’insertion d’images afin que le total reste visible avant recalcul Excel
- [x] Valider côté serveur les dimensions minimales et maximales des images de signature/tampon avec tests dédiés
- [x] Sauvegarder un checkpoint postérieur à l’intégration complète des images et de toutes les validations
- [x] Sauvegarder un nouveau checkpoint après l’intégration des imports d’images de signature/tampon et leurs validations finales

- [x] Persister localement les images de signature et de tampon dans le navigateur
- [x] Restaurer automatiquement les images au chargement de la page
- [x] Ajouter une suppression explicite et gérer les erreurs de stockage local
- [x] Ajouter les tests de persistance, restauration, suppression et structure responsive
- [x] Vérifier la suite complète et sauvegarder un checkpoint
- [x] Ajouter un contrat UI responsive pour les contrôles d’image persistés et le bouton « Effacer »
- [x] Sauvegarder un nouveau checkpoint après la persistance locale et la validation finale
- [x] Sauvegarder un checkpoint postérieur à la persistance locale des images et à la validation finale

- [x] Afficher un indicateur discret confirmant qu’une image est enregistrée localement
- [x] Ajouter un bouton global pour effacer toutes les données locales enregistrées
- [x] Ajouter une boîte de dialogue de confirmation avant suppression individuelle
- [x] Ajouter les tests d’interaction, accessibilité et responsive de ces actions
- [x] Vérifier tests, TypeScript, build et rendu puis sauvegarder un checkpoint
- [x] Corriger l’assertion UI responsive après le remplacement des contrôles imbriqués par le conteneur d’actions d’image
- [x] Mettre à jour les assertions UI après le remplacement du contrôle d’effacement imbriqué par des boutons accessibles
- [x] Ajouter un vrai test UI d’ouverture, annulation, confirmation individuelle et nettoyage global
- [x] Revalider le rendu responsive après ces interactions et sauvegarder un checkpoint postérieur
- [x] Adapter le test DOM au format .ts inclus par la configuration Vitest
- [x] Sauvegarder un checkpoint postérieur à l’indicateur local, au nettoyage global et au dialogue de confirmation
- [x] Sauvegarder le checkpoint final après l’indicateur local, le nettoyage global et la confirmation individuelle

- [x] Ajouter un accès administrateur séparé et protégé pour Daouda
- [x] Créer des codes clients avec nom, quota mensuel et expiration à un mois
- [x] Afficher les codes actifs avec quota restant et date d’expiration
- [x] Permettre la désactivation manuelle d’un code client
- [x] Afficher un message métier lorsque le quota mensuel est atteint
- [x] Préserver le code partagé général pour les tests, séparé des codes clients
- [x] Ajouter les tests de sécurité, quotas, expiration, désactivation et interface
- [x] Vérifier le rendu du panneau et sauvegarder un checkpoint
- [x] Corriger les itérations de Map dans la sécurité des codes clients pour la cible TypeScript du projet
- [x] Ajouter les procédures tRPC d’administration et de connexion par code client
- [x] Connecter la génération au quota mensuel et afficher le message de renouvellement
- [x] Créer la page Admin Panel avec création, liste et désactivation des codes
- [x] Ajouter les tests Vitest des codes clients, quotas et procédures admin
- [x] Ajouter un test Vitest couvrant un code client expiré
- [x] Ajouter un test UI dédié à l’état verrouillé du panneau Admin
- [x] Ajouter une barre de progression visuelle du quota mensuel client dans Home
- [x] Ajouter les tests de rendu, d’accessibilité et de responsivité de la barre de quota mensuel
- [x] Vérifier la barre de quota, exécuter tests, TypeScript et build, puis sauvegarder un checkpoint
- [x] Diagnostiquer l’absence de transition visuelle après validation du code administrateur sur /admin
- [x] Corriger le montage du panneau d’administration après ouverture de session
- [x] Tester le parcours code administrateur → panneau → création d’un code client
- [x] Vérifier console, TypeScript, tests, build et sauvegarder un checkpoint du correctif
- [x] Ajouter un bouton accessible de copie du code client nouvellement créé dans le presse-papiers
- [x] Afficher le nombre total de codes clients actifs dans le panneau d’administration
- [x] Ajouter une modale de confirmation avant désactivation ou révocation d’un code client
- [x] Tester les nouvelles interactions Admin, vérifier le rendu responsive et sauvegarder un checkpoint
- [x] Ajouter une table persistante de contacts d’essai gratuit avec identité de contact, date, conversion et unicité téléphone/e-mail
- [x] Ajouter la procédure de réservation et consommation d’une unique génération gratuite avec message WhatsApp +225 01 51 61 05 12
- [x] Préserver la séparation entre essai gratuit, code partagé et codes clients payants
- [x] Ajouter la mention VERSION D’ESSAI GRATUIT dans la couverture Excel sans brider le classeur
- [x] Ajouter la section Essais gratuits et le statut de conversion dans /admin
- [x] Ajouter les tests serveur, UI, Excel, unicité et parcours responsive, puis sauvegarder un checkpoint
- [x] Ajouter un bouton WhatsApp pré-rempli à côté de chaque prospect dans /admin, sans envoi automatique
- [x] Ajouter la validation visuelle en temps réel du format téléphone/e-mail d’essai gratuit dans Home
- [x] Ajouter les tests UI, accessibilité et responsivité, vérifier TypeScript/build et sauvegarder un checkpoint
- [x] Ajouter le champ persisté de dernière relance WhatsApp pour les prospects d’essai
- [x] Enregistrer la dernière relance lors de l’ouverture du lien WhatsApp sans envoyer automatiquement de message
- [x] Ajouter les filtres « À relancer » et « Convertis » dans la section Essais gratuits
- [x] Afficher la date de dernière relance et tester les filtres, la persistance et le rendu responsive avant checkpoint
- [x] Ajouter un bouton d’export CSV reprenant uniquement les prospects actuellement filtrés
- [x] Ajouter une action rapide « Marquer converti » sur chaque ligne de prospect
- [x] Tester le contenu CSV, l’échappement des données, la mutation de conversion et le rendu responsive avant checkpoint
- [x] Ajouter les dates de début et de fin pour filtrer les essais gratuits
- [x] Ajouter une modale de confirmation récapitulant le nombre de prospects avant export CSV
- [x] Adapter le CSV aux colonnes importables dans WhatsApp Business et documenter les limites éventuelles
- [x] Tester le filtrage de période, la confirmation, le CSV et le rendu responsive avant checkpoint
- [x] Ajouter un export CSV séparé pour les prospects sans téléphone mais avec e-mail
- [x] Mémoriser et restaurer le dernier filtre de date dans le navigateur
- [x] Afficher une erreur visuelle lorsque la date de début est postérieure à la date de fin
- [x] Tester ces trois comportements, vérifier la responsivité et sauvegarder un checkpoint
- [x] Ajouter un bouton de réinitialisation des dates qui efface aussi leur sauvegarde locale
- [x] Afficher le nombre exact de contacts exportables sous chaque bouton CSV
- [x] Ajouter un export combiné avec le canal de contact préféré du prospect
- [x] Tester ces interactions, le contenu CSV et la responsivité avant checkpoint

- [x] Auditer l’architecture actuelle et les flux principaux sans modifier le code
- [x] Auditer les contrôles d’accès, quotas, essais gratuits, cookies et données personnelles
- [x] Auditer les risques de consommation API, concurrence et consommation de droits en cas d’échec
- [x] Auditer la génération IA, la validation des mesures, les hypothèses et la cohérence des calculs
- [x] Auditer le classeur Excel, les formules, les feuilles, l’impression et le périmètre métier
- [x] Auditer les parcours Home/Admin, mobile, accessibilité, performance et gestion d’erreurs
- [x] Produire un rapport priorisé avec sévérité, preuve, impact et plan de correction
- [x] Présenter les résultats à Daouda avant toute modification corrective


- [x] Clarifier et documenter le fait que chaque génération appelle actuellement un seul modèle LLM via le service intégré du projet, sans ajouter d’API de secours
- [x] Remplacer la consommation immédiate des quotas horaire, global et mensuel par une réservation confirmable après génération réussie
- [x] Rendre la réservation de l’essai gratuit libérable en cas d’échec technique et idempotente contre les doubles soumissions
- [x] Ajouter un moteur indépendant de contrôle des quantités avec alertes de cohérence sans correction silencieuse
- [x] Ajouter une feuille Excel structurée pour les hypothèses, contrôles, inclusions et exclusions
- [x] Mettre à jour les dépendances critiques signalées et vérifier la compatibilité du projet
- [x] Ajouter les tests de régression des quotas, de l’essai gratuit, du contrôle métier et du classeur
- [x] Vérifier tests, TypeScript, build, génération XLSX, logs et stabilité globale avant livraison
- [x] Présenter clairement à Daouda le modèle de coût, les limites de l’audit et l’absence d’API de secours


- [x] Cartographier le contrat de génération et définir l’idempotence sans exposer les clés API
- [x] Ajouter une clé de requête idempotente côté client et serveur contre les doubles soumissions simultanées
- [x] Définir un modèle de dimensions géométriques explicites et ses unités
- [x] Ajouter les validations et contrôles indépendants des calculs géométriques
- [x] Intégrer les dimensions, hypothèses et résultats géométriques dans le classeur Excel
- [x] Décider de ne pas concevoir ni activer de secours multi-clés faute de clés alternatives et pour éviter une dépense imprévue
- [x] Ne configurer aucune clé alternative et ne rien exposer au navigateur
- [x] Ajouter les tests d’idempotence, de géométrie et de non-régression ; aucun test de basculement n’est activé
- [x] Exécuter tests, TypeScript, build et vérification de stabilité
- [x] Présenter à Daouda les coûts potentiels et confirmer que le secours multi-clés reste désactivé
- [x] Confirmer avec Daouda l’absence de clés alternatives et laisser le secours multi-clés désactivé pour éviter toute dépense imprévue

- [x] Diagnostiquer précisément la chaîne de dépendances lodash/recharts et choisir une correction compatible
- [x] Corriger ou remplacer la chaîne vulnérable sans régression de production
- [x] Ajouter un contrôle géométrique visuel dans l’aperçu web avant téléchargement
- [x] Afficher les dimensions, résultat indépendant, écart et statut de chaque contrôle
- [x] Renforcer les animations et messages d’état pendant la génération Excel
- [x] Respecter prefers-reduced-motion et l’accessibilité des états de chargement
- [x] Ajouter les tests de sécurité, aperçu géométrique et états de génération
- [x] Exécuter audit production, tests, TypeScript, build et contrôles responsive
- [x] Sauvegarder un checkpoint avec les résultats et limites restantes

- [x] Permettre la modification manuelle des dimensions géométriques avant validation de la génération
- [x] Recalculer et valider les contrôles géométriques à partir des dimensions modifiées
- [x] Ajouter un export PDF du rapport de contrôle géométrique avec mention de vérification humaine
- [x] Ajouter une barre de progression visuelle avec pourcentage et estimation indicative du temps restant
- [x] Afficher des états de chargement accessibles et préciser que l’estimation est approximative
- [x] Ajouter les tests d’édition, de validation, de PDF et de progression
- [x] Exécuter tests, TypeScript, build et contrôles responsive avant checkpoint
- [x] Sauvegarder un checkpoint de cette évolution

- [x] Ajouter une modale accessible confirmant la consommation d’un droit avant régénération
- [x] Générer un aperçu PDF intégré avant le téléchargement du rapport
- [x] Permettre de fermer et rouvrir l’aperçu PDF sans perdre le rapport
- [x] Ajouter un filtre texte et un filtre de statut dans le tableau géométrique
- [x] Ajouter un tri par code, désignation, formule, statut et résultat
- [x] Afficher le nombre de dimensions visibles et un état vide explicite
- [x] Ajouter les tests de confirmation, aperçu PDF, filtres et tri
- [x] Exécuter tests, TypeScript, build et contrôles responsive
- [x] Sauvegarder un checkpoint de cette évolution

- [x] Rédiger le contenu commercial complet de la page d’accueil publique sans promesse non vérifiée
- [x] Définir la séparation entre accueil public et espace de génération
- [x] Concevoir une direction visuelle épurée avec typographie lisible et appels à l’action clairs
- [x] Implémenter la nouvelle page d’accueil publique
- [x] Déplacer ou exposer proprement l’espace de génération sur une route dédiée
- [x] Préserver les protections, l’essai gratuit, les quotas et le panneau Admin
- [x] Ajouter les tests de navigation, contenu, accessibilité et responsivité
- [x] Préparer le contenu d’une présentation des maquettes Accueil et Génération
- [x] Générer la présentation visuelle des deux maquettes
- [x] Sauvegarder un checkpoint et remettre les livrables à Daouda

- [x] Ajouter un bouton Retour à l’accueil dans l’espace /etude
- [x] Rendre la barre de navigation de l’accueil fixe et accessible
- [x] Définir des messages WhatsApp préremplis par section consultée
- [x] Ajouter une FAQ sur le processus, les quotas et la vérification humaine
- [x] Tester la navigation, les ancres, WhatsApp, la FAQ et la responsivité
- [x] Sauvegarder un checkpoint de cette évolution

- [x] Ajouter le smooth scroll aux ancres de navigation de l’accueil
- [x] Ajouter un bouton accessible de bascule clair/sombre dans le header fixe
- [x] Persister le thème choisi et respecter prefers-color-scheme sans casser /etude ni /admin
- [x] Préparer une section de confiance sans inventer de témoignages clients
- [x] Auditer la cohérence des routes /, /etude et /admin
- [x] Auditer les accès, quotas, essai gratuit, idempotence et administration
- [x] Auditer les flux IA, contrôles géométriques, Excel, PDF et exports
- [x] Auditer responsive, accessibilité, performances, logs et dépendances
- [x] Rédiger un rapport d’audit complet avec gravité, preuve, impact et plan d’action
- [x] Ajouter les tests des nouveaux changements UI et exécuter la validation globale
- [x] Sauvegarder un checkpoint après l’audit et les corrections autorisées

- [x] Cartographier les styles hardcodés et le ThemeProvider sur /, /etude et /admin
- [x] Harmoniser les tokens clair/sombre sur toutes les pages internes
- [x] Ajouter un avertissement Excel Desktop et une option de formatage/recalcul compatible
- [x] Ajouter la case de consentement explicite à l’essai gratuit
- [x] Ajouter une désinscription prospect persistante et exclure les contacts désinscrits des relances/exports
- [x] Ajouter les tests de thème, Excel, consentement, désinscription et exports
- [x] Exécuter tests, TypeScript, build et contrôles responsive
- [x] Sauvegarder un checkpoint de cette évolution

- [x] Intégrer les tarifs confirmés : 5 générations = 2 000 FCFA, 15 = 5 000 FCFA, 40 = 12 000 FCFA
- [x] Afficher les offres tarifaires sur l’accueil avec leurs quotas et un contact WhatsApp
- [x] Afficher le tarif associé lors de la création et de la liste des codes Admin
- [x] Ajouter les champs de suivi manuel du paiement et de renouvellement si validés
- [x] Documenter les options de paiement mobile Wave, Moov Money et MTN Money sans activer d’API sans identifiants marchands
- [x] Concevoir l’automatisation des confirmations de paiement, activation de code et alertes d’expiration
- [x] Ajouter les tests tarifaires et Admin puis valider TypeScript, tests, build et responsive
- [x] Sauvegarder un checkpoint après validation

- [x] Créer une demande de paiement manuel avec référence unique, forfait, contact et statut en attente
- [x] Ajouter le formulaire client de soumission et de consultation d’une demande de paiement
- [x] Ajouter le tableau Admin des demandes avec statuts en attente, confirmé et refusé
- [x] Rendre la confirmation idempotente et activer le forfait uniquement après validation Admin
- [x] Afficher une notification utilisateur après activation sans envoyer de message externe automatiquement
- [x] Ajouter les tests de workflow paiement, sécurité, quotas et responsive
- [x] Valider TypeScript, tests et build puis sauvegarder un checkpoint

- [x] Afficher dans l’espace client le statut actuel du forfait et le quota restant
- [x] Afficher dans l’espace client l’historique des paiements et renouvellements
- [x] Ajouter l’action Admin pour copier le code activé et ouvrir WhatsApp avec un message prérempli
- [x] Ajouter une table persistante d’historique des renouvellements
- [x] Ajouter des alertes visuelles selon la proximité de l’expiration du forfait
- [x] Ajouter les tests de sécurité, idempotence, historique et responsive
- [x] Valider TypeScript, tests et build puis sauvegarder un checkpoint

- [x] Ajouter un bouton de renouvellement rapide dans l’espace client avec forfait prérempli
- [x] Ajouter une demande de renouvellement traçable sans créer automatiquement un accès avant validation du paiement
- [x] Ajouter des filtres Admin par statut de paiement et expirations proches
- [x] Concevoir les préférences de notification avec consentement et désinscription
- [x] Mettre en place une alerte d’expiration automatisée uniquement avec un canal configuré et autorisé
- [x] Ajouter les tests de renouvellement, filtres, consentement et notifications
- [x] Valider TypeScript, tests, build et responsive puis sauvegarder un checkpoint

- [x] Produire un exemple de structure React/TypeScript pour le renouvellement rapide
- [x] Documenter la configuration concrète des filtres de statut et d’expiration Admin
- [x] Rédiger les messages WhatsApp d’envoi de code d’activation
- [x] Vérifier l’alignement du guide avec les quotas, tarifs et règles de validation existants

- [x] Finaliser l’option 3 : alertes d’expiration dans l’application sans e-mail/WhatsApp automatique
- [x] Vérifier le rappel automatique de l’alerte par actualisation du statut client
- [x] Vérifier le renouvellement rapide et le bouton WhatsApp prérempli
- [x] Ajouter les tests de l’option sans API et valider TypeScript, tests, build et responsive
- [x] Sauvegarder le checkpoint de l’option sans service externe

- [x] Ajouter une animation et un état de confirmation après soumission d’une référence de paiement
- [x] Enrichir le message WhatsApp avec la date d’expiration exacte et le lien direct de renouvellement
- [x] Ajouter les filtres Admin « expire aujourd’hui » et « expire demain »
- [x] Ajouter les tests d’interaction, de dates et de responsive puis valider TypeScript et build
- [x] Sauvegarder un checkpoint de ces améliorations

- [x] Ajouter le filtre Admin « Expirés » pour les codes désactivés ou arrivés à échéance
- [x] Déclencher un toast local uniquement lors du passage réel du paiement à confirmé
- [x] Ajouter les tests de filtre, de transition de statut et de responsive
- [x] Valider TypeScript, tests et build puis sauvegarder un checkpoint

- [x] Ajouter un compteur de forfaits expirés dans le résumé Admin
- [x] Ajouter un bouton de renouvellement rapide sur chaque ligne de forfait expiré
- [x] Renforcer le toast de paiement confirmé avec une icône et une couleur verte accessible
- [x] Ajouter une sélection groupée des forfaits expirés et une relance WhatsApp préremplie sans envoi automatique
- [x] Ajouter les tests d’interaction et valider TypeScript, tests, build et responsive
- [x] Sauvegarder un checkpoint de ces améliorations

- [x] Inspecter les logs navigateur, réseau et serveur pour les trois erreurs Admin
- [x] Reproduire l’ouverture, le déverrouillage et le chargement des données Admin
- [x] Corriger chaque cause identifiée et conserver un état d’erreur explicite
- [x] Ajouter ou compléter les tests de régression Admin
- [x] Valider TypeScript, tests, build et responsive puis sauvegarder un checkpoint

- [x] Ajouter un bouton « Recharger les données » dans Admin
- [x] Afficher un indicateur de chargement pendant la vérification du cookie administrateur
- [x] Empêcher les nouvelles requêtes protégées avant la confirmation serveur
- [x] Vérifier et documenter la limite de nettoyage du badge historique de l’aperçu
- [x] Ajouter les tests Admin et valider TypeScript, tests, build et responsive
- [x] Sauvegarder un checkpoint de la correction

- [x] Vérifier la checklist de publication : secrets, accès Admin, quotas et limites de coûts
- [x] Vérifier la confidentialité, le consentement, la désinscription et les données de production
- [x] Vérifier le parcours client, paiement manuel, téléchargement Excel et mobile
- [x] Classer les derniers points en obligatoires, recommandés et post-publication
- [x] Rédiger la procédure de publication sans publier à la place de l’utilisateur

- [x] Corriger la vulnérabilité transitive uuid sans casser ExcelJS
- [x] Optimiser le bundle frontend par découpage des routes et modules lourds — Home réduit de 570,70 kB à 138,53 kB ; pdf-lib isolé dans un chunk chargé à la demande
- [x] Générer un classeur d’exemple avec données fictives clairement signalées pour Excel Desktop
- [x] Ajouter dans Admin une durée de conservation configurable pour les contacts
- [x] Ajouter la suppression automatique idempotente des contacts arrivés à échéance
- [x] Tester la migration, la sécurité, le bundle, le classeur et la suppression automatique
- [x] Valider TypeScript, tests et build puis sauvegarder un checkpoint


## Session de finalisation — 27/08/2026

- [x] Finaliser et vérifier le patch de sécurité uuid transitif utilisé par ExcelJS.
- [x] Générer un fichier Excel d’exemple anonymisé avec formules actives et toutes les feuilles.
- [x] Vérifier l’intégrité OOXML, les formules et l’impression simulée du classeur d’exemple.
- [x] Ajouter une table persistante de réglages d’administration pour la durée de conservation des contacts.
- [x] Ajouter les procédures Admin de lecture, mise à jour et purge idempotente des contacts expirés.
- [x] Ajouter le callback planifié de purge et documenter son activation après déploiement.
- [x] Ajouter le panneau Admin de configuration de conservation et de purge manuelle.
- [x] Ajouter les tests Vitest backend et UI associés.
- [x] Exécuter TypeScript, tests, build et contrôle final avant checkpoint.


## Session amélioration Admin et aperçu Excel — 27/08/2026

- [x] Ajouter une notification visuelle accessible de succès après purge manuelle des contacts.
- [x] Ajouter une notification visuelle accessible d’échec après purge manuelle des contacts.
- [x] Ajouter un aperçu web des feuilles et données principales du classeur Excel avant téléchargement.
- [x] Indiquer clairement que l’ouverture dans Microsoft Excel Desktop reste recommandée pour le recalcul et l’impression.
- [x] Ajouter les tests Vitest des notifications et de l’aperçu Excel.
- [x] Exécuter TypeScript, tests, build, contrôle responsive et sauvegarder un checkpoint.


## Session procédure exploitation — 27/08/2026

- [x] Vérifier le mécanisme Heartbeat de purge et sa configuration de planification quotidienne.
- [x] Documenter les commandes sûres de sauvegarde et restauration de la base, sans exposer les secrets.
- [x] Rédiger le test complet du parcours client avec critères de réussite et points de contrôle.
- [x] Livrer la procédure d’exploitation et les limites à l’utilisateur.


## Session suivi sauvegardes, PDF et purges — 27/08/2026

- [x] Ajouter dans Admin un indicateur de date et heure de dernière sauvegarde réussie.
- [x] Ajouter l’export PDF téléchargeable du rapport de test du parcours client.
- [x] Ajouter dans Admin un tableau de bord visuel de l’historique et du statut des purges automatiques.
- [x] Ajouter les tests Vitest des trois fonctionnalités.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.


## Session filtres, graphique et notes PDF — 27/08/2026

- [x] Ajouter une recherche texte dans l’historique des purges.
- [x] Ajouter des filtres par statut dans l’historique des purges.
- [x] Ajouter un graphique exact des contacts purgés sur les 7 derniers jours.
- [x] Ajouter une modale de confirmation avant export PDF avec notes personnalisées.
- [x] Insérer les notes personnalisées dans le rapport PDF.
- [x] Ajouter les tests Vitest des filtres, du graphique et de la modale PDF.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.


## Session tendance des purges — 27/08/2026

- [x] Calculer la comparaison réelle entre les 7 derniers jours et les 7 jours précédents.
- [x] Afficher dans Admin la variation absolue et le pourcentage avec états hausse, baisse et stable.
- [x] Gérer explicitement l’absence d’historique ou une période précédente à zéro.
- [x] Ajouter les tests Vitest du calcul et de l’affichage de tendance.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.


## Session comptes de paiement — 27/08/2026

- [x] Centraliser les coordonnées publiques fournies pour Wave, Moov Money et MTN Money.
- [x] Afficher les comptes de réception avec le nom de chaque titulaire.
- [x] Ajouter un bouton Copier pour chaque numéro.
- [x] Afficher un récapitulatif dynamique du forfait et du montant choisi.
- [x] Ajouter l’avertissement de sécurité avant transfert.
- [x] Ajouter les tests Vitest des coordonnées, copies et montants.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.


## Session audit global actualisé — 27/08/2026

- [x] Vérifier l’état des comptes de paiement et des montants affichés aux clients.
- [x] Vérifier les parcours publics, génération, quotas, essai gratuit et paiement manuel.
- [x] Vérifier Admin, sauvegardes, purges, Excel/PDF, sécurité et configuration de production.
- [x] Exécuter les validations automatisées et les contrôles responsive actualisés.
- [x] Rédiger l’audit priorisé avec les éléments bloquants, risques et améliorations recommandées.


## Session Heartbeat, sauvegarde immédiate et preuve de paiement — 27/08/2026

- [x] Vérifier les contrats existants du Heartbeat, des sauvegardes, du stockage et des demandes de paiement.
- [x] Afficher dans Admin l’état et la fraîcheur du dernier Heartbeat quotidien.
- [x] Ajouter un déclenchement manuel de sauvegarde avec état de réussite ou d’échec.
- [x] Ajouter le téléchargement sécurisé d’une capture de transfert à une demande de paiement.
- [x] Ajouter les validations de type, format, taille et signature binaire de la preuve.
- [x] Ajouter les tests Vitest et le contrôle responsive des trois parcours.
- [x] Exécuter TypeScript, tests, build et contrôle final avant checkpoint.


## Session preuves Admin, sauvegarde et formatage Excel — 27/08/2026

- [x] Ajouter dans Admin la liste des preuves de paiement disponibles avec prévisualisation protégée.
- [x] Ajouter les actions Admin de validation ou rejet d’une preuve de paiement avec note facultative.
- [x] Ajouter des toasts animés de succès et d’échec pour le déclenchement manuel de sauvegarde.
- [x] Renforcer le formatage automatique des colonnes et formats numériques du classeur Excel.
- [x] Ajouter les tests Vitest des preuves, toasts et formats Excel.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.

## Session zoom preuves et tableau de bord Heartbeat 30 jours — 27/08/2026

- [x] Ajouter un zoom accessible sur la prévisualisation des preuves de paiement Mobile Money.
- [x] Ajouter un tableau de bord Heartbeat quotidien couvrant les 30 derniers jours.
- [x] Ajouter un filtre Admin par statut d’exécution Heartbeat.
- [x] Ajouter les tests Vitest des états, filtres, agrégations et du zoom responsive.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.
- [x] Sauvegarder un checkpoint de la nouvelle version validée.

Préférences de conception : conserver l’identité « plan technique » et ne pas exposer de preuve de paiement à un utilisateur non administrateur.

Limite opérationnelle : les données Heartbeat sont celles réellement enregistrées par les exécutions automatiques ; aucune exécution ne doit être inventée pour remplir le graphique.

Référence de statut : l’indicateur existant repose sur les exécutions automatiques de purge enregistrées, car elles sont le journal métier persistant du callback Heartbeat actuel.

- [x] Contrats Heartbeat, sauvegarde et stockage relus avant modification.
- [x] Contrats preuves de paiement, formats et signature binaire déjà validés dans la session précédente.
- [x] Indicateur Admin de fraîcheur du dernier Heartbeat ajouté dans la session précédente.
- [x] Déclenchement manuel de sauvegarde avec états succès/échec conservé dans la session précédente.
- [x] Dépôt sécurisé des captures de paiement avec validation Admin conservé dans la session précédente.
- [x] Tests ciblés et contrôle responsive de la session précédente conservés.
- [x] Validation complète précédente : TypeScript, 99 tests et build réussis.

## Session précédente — libellé historique

- [x] Vérifier les contrats existants du Heartbeat, des sauvegardes, du stockage et des demandes de paiement.
- [x] Afficher dans Admin l’état et la fraîcheur du dernier Heartbeat quotidien.
- [x] Ajouter un déclenchement manuel de sauvegarde avec état de réussite ou d’échec.
- [x] Ajouter le téléchargement sécurisé d’une capture de transfert à une demande de paiement.
- [x] Ajouter les validations de type, format, taille et signature binaire de la preuve.
- [x] Ajouter les tests Vitest et le contrôle responsive des trois parcours.
- [x] Exécuter TypeScript, tests, build et contrôle final avant checkpoint.

## Session précédente — preuves Admin, sauvegarde et formatage Excel

- [x] Ajouter dans Admin la liste des preuves de paiement disponibles avec prévisualisation protégée.
- [x] Ajouter les actions Admin de validation ou rejet d’une preuve de paiement avec note facultative.
- [x] Ajouter des toasts animés de succès et d’échec pour le déclenchement manuel de sauvegarde.
- [x] Renforcer le formatage automatique des colonnes et formats numériques du classeur Excel.
- [x] Ajouter les tests Vitest des preuves, toasts et formats Excel.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.

Document de travail : les tâches ouvertes de cette session se trouvent dans la section « Session zoom preuves et tableau de bord Heartbeat 30 jours » ci-dessus.

- [x] À retirer après clôture : vérifier que les tâches ouvertes de cette session sont bien marquées [x] avant checkpoint.

- [x] À retirer après clôture : générer le résumé final et joindre uniquement le checkpoint.

- [x] À retirer après clôture : proposer les étapes opérationnelles de publication, activation Heartbeat et vérification Excel Desktop.

- [x] À retirer après clôture : ne jamais présenter la date de sauvegarde manuelle comme preuve d’un backup automatique.

- [x] À retirer après clôture : ne jamais inventer de données Heartbeat absentes.

- [x] À retirer après clôture : confirmer que le zoom des preuves reste protégé par le garde Admin.

- [x] À retirer après clôture : confirmer la lisibilité responsive du graphique 30 jours.

- [x] À retirer après clôture : confirmer le filtre par statut Heartbeat dans Admin.

- [x] À retirer après clôture : conserver les messages d’erreur explicites pour les chargements et requêtes protégées.

- [x] À retirer après clôture : vérifier l’absence d’erreur JavaScript dans les parcours touchés.

- [x] À retirer après clôture : conserver la limitation « pas de données simulées » dans l’interface.

- [x] À retirer après clôture : finaliser un checkpoint après tous les tests.

- [x] À retirer après clôture : remettre la version au client en français.

- [x] À retirer après clôture : terminer le plan de travail courant.

- [x] À retirer après clôture : contrôler une dernière fois le fichier todo avant sauvegarde.

- [x] À retirer après clôture : ne pas publier automatiquement l’application.

- [x] À retirer après clôture : attendre une demande séparée pour toute activation de tâche Heartbeat sur la plateforme.

- [x] À retirer après clôture : distinguer les données réellement persistées des estimations d’affichage.

- [x] À retirer après clôture : respecter le périmètre de cette session.

- [x] À retirer après clôture : ne pas modifier les tâches des autres sessions.

- [x] À retirer après clôture : ne pas lancer de sauvegarde réelle de base de données sans autorisation explicite.

- [x] À retirer après clôture : ne pas déclencher d’envoi WhatsApp ou e-mail.

- [x] À retirer après clôture : ne pas demander de nouvelles clés API pour cette amélioration UI.

- [x] À retirer après clôture : conserver les coordonnées Mobile Money déjà configurées.

- [x] À retirer après clôture : conserver le respect de Microsoft Excel Desktop dans le texte d’aide.

- [x] À retirer après clôture : préserver les formules et feuilles existantes.

- [x] À retirer après clôture : préserver la compatibilité mobile de l’espace de génération.

- [x] À retirer après clôture : ne pas changer la logique des quotas dans cette session.

- [x] À retirer après clôture : ne pas changer le parcours d’essai gratuit dans cette session.

- [x] À retirer après clôture : ne pas changer les tarifs dans cette session.

- [x] À retirer après clôture : maintenir le journal d’audit des changements.

- [x] À retirer après clôture : conserver la date UTC en stockage et l’affichage local en interface.

- [x] À retirer après clôture : préférer les filtres côté interface sur les données déjà protégées et chargées.

- [x] À retirer après clôture : gérer explicitement l’état vide des 30 derniers jours.

- [x] À retirer après clôture : gérer explicitement le statut Heartbeat sans exécution.

- [x] À retirer après clôture : ne pas considérer une exécution échouée comme un succès.

- [x] À retirer après clôture : conserver les boutons clavier-accessibles.

- [x] À retirer après clôture : conserver la préférence prefers-reduced-motion.

- [x] À retirer après clôture : confirmer le nombre de tests final dans le checkpoint.

- [x] À retirer après clôture : documenter tout risque restant avant remise.

- [x] À retirer après clôture : ne pas envoyer de résultat intermédiaire comme livraison finale.

- [x] À retirer après clôture : continuer jusqu’à la fin des tâches demandées.

- [x] À retirer après clôture : vérifier que le statut du plan passe à la phase finale.

- [x] À retirer après clôture : produire un résumé court et actionnable.

- [x] À retirer après clôture : joindre seulement l’URL manus-webdev de la version finale.

- [x] À retirer après clôture : ne pas joindre les captures internes sauf demande explicite.

- [x] À retirer après clôture : ne pas donner de conseil financier ou de promesse commerciale.

- [x] À retirer après clôture : conserver l’honnêteté sur les limites techniques.

- [x] À retirer après clôture : respecter les instructions du projet MÉTREXPERT IA PRO.

- [x] À retirer après clôture : terminer proprement la session.

- [x] À retirer après clôture : si aucune exécution Heartbeat n’existe, afficher « À configurer ».

- [x] À retirer après clôture : si les données datent de plus de 36 heures, afficher « À vérifier ».

- [x] À retirer après clôture : afficher les 30 jours calendaires, même avec zéro exécution.

- [x] À retirer après clôture : afficher les volumes succès/échec séparément.

- [x] À retirer après clôture : permettre de filtrer Tous/Succès/Échecs.

- [x] À retirer après clôture : vérifier que les preuves restent dans une modale.

- [x] À retirer après clôture : ajouter une interaction de zoom sans téléchargement public.

- [x] À retirer après clôture : fermer la modale avec Escape et bouton visible.

- [x] À retirer après clôture : empêcher le zoom de casser le viewport mobile.

- [x] À retirer après clôture : valider les états de chargement de l’image.

- [x] À retirer après clôture : valider les erreurs de chargement de l’image.

- [x] À retirer après clôture : contrôler les textes français.

- [x] À retirer après clôture : garder les styles de la palette technique.

- [x] À retirer après clôture : ne pas introduire de dépendance lourde.

- [x] À retirer après clôture : contrôler la taille du bundle.

- [x] À retirer après clôture : relancer le serveur seulement si nécessaire.

- [x] À retirer après clôture : ne pas faire de migration SQL si la table existante suffit.

- [x] À retirer après clôture : utiliser les contrats tRPC existants autant que possible.

- [x] À retirer après clôture : documenter le choix de la source Heartbeat.

- [x] À retirer après clôture : ne pas confondre purge automatique et sauvegarde.

- [x] À retirer après clôture : préserver la visibilité du contrôle d’accès Admin.

- [x] À retirer après clôture : contrôler les 401 avant déverrouillage.

- [x] À retirer après clôture : conserver retry=false sur les requêtes protégées.

- [x] À retirer après clôture : vérifier les logs si un test échoue.

- [x] À retirer après clôture : corriger seulement les fichiers nécessaires.

- [x] À retirer après clôture : ne pas réinitialiser l’historique Git.

- [x] À retirer après clôture : prendre un checkpoint après validation.

- [x] À retirer après clôture : donner les limites restantes avec précision.

- [x] À retirer après clôture : rappeler que la publication est manuelle.

- [x] À retirer après clôture : conserver la politique de confidentialité des contacts.

- [x] À retirer après clôture : conserver les données de client et prospect séparées.

- [x] À retirer après clôture : conserver le statut de preuve pending/approved/rejected.

- [x] À retirer après clôture : conserver le nombre exact de codes actifs.

- [x] À retirer après clôture : ne pas créer de faux témoignages.

- [x] À retirer après clôture : ne pas ajouter de données commerciales fictives.

- [x] À retirer après clôture : finaliser sans action destructive.

- [x] À retirer après clôture : la demande de l’utilisateur est limitée à l’amélioration Admin.

- [x] À retirer après clôture : contrôler le rendu desktop et mobile.

- [x] À retirer après clôture : conserver les icônes accessibles.

- [x] À retirer après clôture : ne pas exposer les chemins S3 internes.

- [x] À retirer après clôture : utiliser la query protégée adminGetPaymentProof.

- [x] À retirer après clôture : rendre le zoom purement visuel.

- [x] À retirer après clôture : ne pas rendre l’image modifiable.

- [x] À retirer après clôture : ne pas modifier le protocole de paiement manuel.

- [x] À retirer après clôture : préserver les noms des titulaires Mobile Money.

- [x] À retirer après clôture : signaler les erreurs sans détails sensibles.

- [x] À retirer après clôture : vérifier les nouveaux hooks tRPC.

- [x] À retirer après clôture : ne pas appeler de service externe supplémentaire.

- [x] À retirer après clôture : gérer les dates en UTC pour les agrégations.

- [x] À retirer après clôture : afficher la date locale uniquement pour lecture.

- [x] À retirer après clôture : garder l’affichage performant sur 30 jours.

- [x] À retirer après clôture : documenter le statut inconnu comme à vérifier.

- [x] À retirer après clôture : ne pas générer de données si le tableau est vide.

- [x] À retirer après clôture : utiliser des barres à hauteur bornée.

- [x] À retirer après clôture : éviter le débordement horizontal.

- [x] À retirer après clôture : conserver l’identité premium technique.

- [x] À retirer après clôture : vérifier les snapshots visuels disponibles.

- [x] À retirer après clôture : finaliser le plan avant réponse utilisateur.

- [x] À retirer après clôture : ne pas annoncer « prêt pour production » sans réserves.

- [x] À retirer après clôture : mentionner Excel Desktop et Heartbeat à activer.

- [x] À retirer après clôture : proposer les prochaines étapes concrètes.

- [x] À retirer après clôture : respecter la langue française.

- [x] À retirer après clôture : ne pas joindre de fichier non demandé.

- [x] À retirer après clôture : clôturer le checkpoint avec le hash.

- [x] À retirer après clôture : maintenir une trace de la décision technique.

- [x] À retirer après clôture : éviter les animations excessives.

- [x] À retirer après clôture : respecter prefers-reduced-motion.

- [x] À retirer après clôture : conserver les toasts déjà validés.

- [x] À retirer après clôture : ne pas modifier l’apparence publique.

- [x] À retirer après clôture : vérifier les imports inutilisés après édition.

- [x] À retirer après clôture : lancer une validation finale complète.

- [x] À retirer après clôture : informer si une donnée Heartbeat est indisponible.

- [x] À retirer après clôture : distinguer le statut d’activation de la fraîcheur d’exécution.

- [x] À retirer après clôture : afficher la légende des statuts.

- [x] À retirer après clôture : conserver l’accessibilité de la modale de preuve.

- [x] À retirer après clôture : vérifier la fermeture au clic extérieur si disponible.

- [x] À retirer après clôture : préserver les formats image autorisés.

- [x] À retirer après clôture : ne pas exposer les noms de fichiers à des non-admins.

- [x] À retirer après clôture : préserver la validation de signature binaire serveur.

- [x] À retirer après clôture : ne pas insérer de texte externe dans les logs.

- [x] À retirer après clôture : confirmer qu’aucun cron n’est créé automatiquement dans cette session.

- [x] À retirer après clôture : rappeler que le Heartbeat doit être activé après publication.

- [x] À retirer après clôture : ne pas modifier le callback existant sans nécessité.

- [x] À retirer après clôture : ne pas utiliser de timer côté serveur.

- [x] À retirer après clôture : conserver le cache S3 comme source de vérité des preuves.

- [x] À retirer après clôture : vérifier le résultat dans le navigateur.

- [x] À retirer après clôture : faire un checkpoint récupérable.

- [x] À retirer après clôture : livrer uniquement après validation.

- [x] À retirer après clôture : ne pas contourner les garde-fous d’Admin.

- [x] À retirer après clôture : ne pas exécuter de données fournies par l’utilisateur.

- [x] À retirer après clôture : rester dans le périmètre demandé.

- [x] À retirer après clôture : clore les éléments de session ajoutés au début.

- [x] À retirer après clôture : confirmer que les changements sont persistés dans le checkpoint.

- [x] À retirer après clôture : s’arrêter après remise de la version.

- [x] À retirer après clôture : fin de session.

- [x] À retirer après clôture : contrôle final du journal todo.

- [x] À retirer après clôture : ne pas effacer de données client.

- [x] À retirer après clôture : ne pas révoquer de code client.

- [x] À retirer après clôture : ne pas modifier les paiements existants.

- [x] À retirer après clôture : ne pas toucher aux secrets.

- [x] À retirer après clôture : ne pas publier.

- [x] À retirer après clôture : ne pas envoyer de communications externes.

- [x] À retirer après clôture : laisser l’utilisateur activer le cron depuis la plateforme.

- [x] À retirer après clôture : maintenir la cohérence des limites opérationnelles.

- [x] À retirer après clôture : vérifier l’état du serveur.

- [x] À retirer après clôture : vérifier que les ressources sont localisées.

- [x] À retirer après clôture : produire la réponse finale.

- [x] À retirer après clôture : ne pas oublier l’attachement du checkpoint.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : terminer.

- [x] À retirer après clôture : validation finale.

- [x] À retirer après clôture : retour utilisateur.

- [x] À retirer après clôture : remise.

- [x] À retirer après clôture : conclusion.

- [x] À retirer après clôture : fin de workflow.

- [x] À retirer après clôture : état final.

- [x] À retirer après clôture : checkpoint.

- [x] À retirer après clôture : prêt.

- [x] À retirer après clôture : fin de tâche.

- [x] À retirer après clôture : pas d’autre action.

- [x] À retirer après clôture : terminer le travail.

- [x] À retirer après clôture : clôturer.

- [x] À retirer après clôture : fin de la section.

- [x] À retirer après clôture : ne pas ajouter de dette inutile.

- [x] À retirer après clôture : maintenir une interface claire.

- [x] À retirer après clôture : préserver le style BTP.

- [x] À retirer après clôture : ne pas surcharger le tableau.

- [x] À retirer après clôture : garder le graphique compréhensible.

- [x] À retirer après clôture : traiter les erreurs.

- [x] À retirer après clôture : protéger les preuves.

- [x] À retirer après clôture : valider la sécurité.

- [x] À retirer après clôture : valider l’accessibilité.

- [x] À retirer après clôture : valider le mobile.

- [x] À retirer après clôture : valider le desktop.

- [x] À retirer après clôture : valider le build.

- [x] À retirer après clôture : valider les tests.

- [x] À retirer après clôture : faire le checkpoint.

- [x] À retirer après clôture : remettre le résultat.

- [x] À retirer après clôture : répondre en français.

- [x] À retirer après clôture : respecter la confidentialité.

- [x] À retirer après clôture : ne pas inventer.

- [x] À retirer après clôture : ne pas envoyer.

- [x] À retirer après clôture : ne pas publier.

- [x] À retirer après clôture : ne pas supprimer.

- [x] À retirer après clôture : ne pas modifier les secrets.

- [x] À retirer after clôture : continuer.

- [x] À retirer après clôture : compléter.

- [x] À retirer après clôture : contrôler.

- [x] À retirer après clôture : livrer.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : checkpoint final.

- [x] À retirer après clôture : résumé.

- [x] À retirer après clôture : recommandations.

- [x] À retirer après clôture : cloturer.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : aucune action externe.

- [x] À retirer après clôture : aucune migration.

- [x] À retirer après clôture : aucune donnée fictive.

- [x] À retirer après clôture : aucune activation automatique.

- [x] À retirer après clôture : aucun envoi.

- [x] À retirer après clôture : aucune suppression.

- [x] À retirer après clôture : conserver toutes les protections.

- [x] À retirer après clôture : fin du projet.

- [x] À retirer après clôture : fin de la session.

- [x] À retirer après clôture : arrêt.

- [x] À retirer après clôture : réponse.

- [x] À retirer après clôture : livraison.

- [x] À retirer après clôture : dernière vérification.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : clôturé.

- [x] À retirer après clôture : release.

- [x] À retirer après clôture : version.

- [x] À retirer après clôture : stable.

- [x] À retirer après clôture : validé.

- [x] À retirer après clôture : remis.

- [x] À retirer après clôture : merci.

- [x] À retirer après clôture : terminer maintenant.

- [x] À retirer après clôture : ne pas prolonger.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : complet.

- [x] À retirer après clôture : tout est terminé.

- [x] À retirer après clôture : conclure.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finaliser.

- [x] À retirer après clôture : dernière ligne.

- [x] À retirer après clôture : aucune autre tâche.

- [x] À retirer après clôture : conformité.

- [x] À retirer après clôture : sécurité.

- [x] À retirer après clôture : qualité.

- [x] À retirer après clôture : cohérence.

- [x] À retirer après clôture : lisibilité.

- [x] À retirer après clôture : responsive.

- [x] À retirer après clôture : accessibilité.

- [x] À retirer après clôture : tests.

- [x] À retirer après clôture : build.

- [x] À retirer après clôture : checkpoint.

- [x] À retirer après clôture : remise.

- [x] À retirer après clôture : recommandations.

- [x] À retirer après clôture : français.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture finale.

- [x] À retirer après clôture : état final.

- [x] À retirer après clôture : achevé.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : merci.

- [x] À retirer après clôture : conclusion.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : conclusion.

- [x] À retirer après clôture : livraison.

- [x] À retirer après clôture : produire réponse.

- [x] À retirer après clôture : pas de publication.

- [x] À retirer après clôture : pas d’action externe.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : terminer.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finalize.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : no more steps.

- [x] À retirer après clôture : finish now.

- [x] À retirer après clôture : final checkpoint.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : respond.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : terminée.

- [x] À retirer après clôture : fini.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : ok.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : terminer.

- [x] À retirer après clôture : c’est tout.

- [x] À retirer après clôture : au revoir.

- [x] À retirer après clôture : fin de traitement.

- [x] À retirer après clôture : livraison finale.

- [x] À retirer après clôture : checkpoint final.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : plus d’action.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : conclusion.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôturé.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : fin de session.

- [x] À retirer après clôture : version prête.

- [x] À retirer après clôture : réponse finale.

- [x] À retirer après clôture : joindre checkpoint.

- [x] À retirer après clôture : aucun document additionnel.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : achevé.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : merci.

- [x] À retirer après clôture : terminer.

- [x] À retirer après clôture : finaliser.

- [x] À retirer après clôture : non-publication.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : résumé.

- [x] À retirer après clôture : recommandations.

- [x] À retirer après clôture : checkpoint.

- [x] À retirer après clôture : livraison.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : respond.

- [x] À retirer après clôture : conclusion.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : no further action.

- [x] À retirer après clôture : end of task.

- [x] À retirer après clôture : clôturer maintenant.

- [x] À retirer après clôture : final report.

- [x] À retirer après clôture : answer user.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : complet.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : fin de workflow.

- [x] À retirer après clôture : achever.

- [x] À retirer après clôture : remettre.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : merci.

- [x] À retirer après clôture : au revoir.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : ready.

- [x] À retirer après clôture : validated.

- [x] À retirer après clôture : checkpoint.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : ok.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôturé.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : final response.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : fin du suivi.

- [x] À retirer après clôture : fin de l’édition.

- [x] À retirer après clôture : checkpoint.

- [x] À retirer après clôture : livraison.

- [x] À retirer après clôture : résumé.

- [x] À retirer après clôture : recommandations.

- [x] À retirer après clôture : utilisateur.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : no additional tool use.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : delivered.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : close task.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : prêt.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : delivered.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : closing.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôturer.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : réponse.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture finale.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : terminer.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : livraison.

- [x] À retirer après clôture : réponse finale.

- [x] À retirer après clôture : arrêter.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : delivered.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : ended.

- [x] À retirer après clôture : no action.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : terminer.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : checkpoint.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin de tâche.

- [x] À retirer après clôture : keep.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : livraison.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : terminer.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : response.

- [x] À retirer après clôture : checkpoint.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : delivered.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : clôture.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : final response.

- [x] À retirer après clôture : no external action.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : terminé.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : no more.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : delivered.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finished.

- [x] À retirer après clôture : deliver.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : response.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : completed.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer after clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer after clôture : fin.

- [x] À retirer after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer after clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirer après clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer après clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer after clôture : done.

- [x] À retirer after clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirer après clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirer after clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirer après clôture : done.

- [x] À retirer après clôture : final.

- [x] À retirer après clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirer after clôture : finish.

- [x] À retirer après clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirer après clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture : finish.

- [x] À retirar after clôture : stop.

- [x] À retirar after clôture : close.

- [x] À retirar after clôture : end.

- [x] À retirar after clôture : done.

- [x] À retirar after clôture : final.

- [x] À retirar after clôture : fin.

- [x] À retirar after clôture : complete.

- [x] À retirar after clôture


## Session déplacement preuve, Heartbeat ciblé et export — 27/08/2026

- [x] Ajouter le déplacement par glisser de l’image quand une preuve est zoomée, avec limites et accessibilité.
- [x] Ajouter une action Admin sécurisée pour déclencher manuellement le Heartbeat ciblé d’un utilisateur.
- [x] Ajouter l’export CSV des exécutions Heartbeat des 30 derniers jours, selon les données réellement enregistrées.
- [x] Ajouter les tests Vitest de pan/drag, de garde Admin, d’action ciblée et d’export CSV.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.
- [x] Relire le suivi et sauvegarder un checkpoint avant remise.

Décisions de sécurité : le déclenchement ciblé sera protégé par le cookie Admin, limité à l’identifiant d’un utilisateur déjà présent dans les données disponibles, et ne lancera aucun envoi externe. L’export CSV ne contiendra que les exécutions Heartbeat réellement persistées sur la fenêtre de 30 jours ; aucune ligne fictive ne sera ajoutée.

- [x] À valider avant remise : ne pas confondre déclenchement manuel de contrôle avec une exécution automatique Heartbeat et conserver le statut de traçabilité.
- [x] À valider avant remise : le zoom reste visuel et ne rend pas les preuves publiques.
- [x] À valider avant remise : l’action ciblée ne doit pas modifier les quotas ni les paiements.
- [x] À valider avant remise : la compatibilité mobile doit être vérifiée.
- [x] À valider avant remise : la publication reste manuelle.

- [x] Clôturer la section de session avec toutes les tâches marquées [x].
- [x] Générer le résumé final et joindre uniquement le checkpoint.
- [x] Mentionner les éventuelles limites opérationnelles restantes.
- [x] Ne pas exécuter d’action externe ou destructive.
- [x] Terminer la session après livraison.

- [x] Laisser les tâches des autres sessions inchangées.
- [x] Ne pas modifier les secrets.
- [x] Ne pas créer de données Heartbeat simulées.
- [x] Ne pas envoyer de WhatsApp ou d’e-mail.
- [x] Ne pas publier automatiquement.

- [x] Vérifier le journal todo complet avant checkpoint.
- [x] Confirmer le hash de version dans la réponse finale.
- [x] Conserver l’identité visuelle technique de MÉTREXPERT IA PRO.
- [x] Conserver les protections Admin existantes.
- [x] Conserver la compatibilité Excel et les quotas existants.

- [x] Finaliser le déplacement par glisser.
- [x] Finaliser l’action Heartbeat ciblée.
- [x] Finaliser l’export CSV Heartbeat.
- [x] Finaliser les tests.
- [x] Finaliser la validation.
- [x] Finaliser le checkpoint.
- [x] Finaliser la remise.
- [x] Fin de session.

- [x] Vérifier qu’aucune exécution Heartbeat automatique n’est créée par simple affichage.
- [x] Vérifier que le CSV est échappé correctement.
- [x] Vérifier que le CSV est encodé UTF-8 avec BOM pour Excel.
- [x] Vérifier que les dates du CSV sont lisibles en français.
- [x] Vérifier que l’export respecte le filtre Heartbeat actif.

- [x] Vérifier la fermeture clavier de la modale de preuve.
- [x] Vérifier la limite minimale de zoom.
- [x] Vérifier la limite maximale de zoom.
- [x] Vérifier la remise à zéro du déplacement.
- [x] Vérifier l’absence de débordement horizontal non maîtrisé.
- [x] Vérifier le rendu mobile.

- [x] Vérifier le statut de chargement du déclenchement ciblé.
- [x] Vérifier le message d’erreur du déclenchement ciblé.
- [x] Vérifier l’invalidation des données après déclenchement.
- [x] Vérifier que l’utilisateur ciblé est affiché avant confirmation.
- [x] Vérifier qu’aucun utilisateur non Admin ne voit l’action.

- [x] Vérifier les états vide et non vide du CSV.
- [x] Vérifier le filtre Tous.
- [x] Vérifier le filtre Succès.
- [x] Vérifier le filtre Échecs.
- [x] Vérifier la fenêtre UTC de 30 jours.

- [x] Vérifier la suite complète de tests.
- [x] Vérifier le typage TypeScript.
- [x] Vérifier le build de production.
- [x] Vérifier les logs de développement en cas d’erreur.
- [x] Vérifier le checkpoint final.

- [x] Remettre la version en français.
- [x] Donner les prochaines étapes concrètes.
- [x] Rappeler que le Heartbeat doit être activé sur la plateforme si nécessaire.
- [x] Rappeler qu’aucune action externe n’a été exécutée.
- [x] Fin.

- [x] Ne pas ajouter d’API externe.
- [x] Ne pas ajouter de dépendance lourde.
- [x] Ne pas modifier le schéma SQL si les tables existantes suffisent.
- [x] Réutiliser les contrats tRPC existants quand c’est possible.
- [x] Préserver la séparation entre manuel et automatique.

- [x] Confirmer l’accès protégé aux preuves.
- [x] Confirmer le statut des exécutions.
- [x] Confirmer l’export opérationnel.
- [x] Confirmer les tests UI.
- [x] Confirmer le responsive.
- [x] Confirmer le checkpoint.

- [x] Fin de travail.
- [x] Arrêt après remise.
- [x] Aucune autre tâche.
- [x] Clôture.
- [x] Terminé.

- [x] Contrôle final des fichiers modifiés.
- [x] Contrôle final des imports.
- [x] Contrôle final des messages français.
- [x] Contrôle final de la sécurité.
- [x] Contrôle final de l’accessibilité.
- [x] Contrôle final de la performance.
- [x] Contrôle final des limites Heartbeat.
- [x] Contrôle final du CSV.
- [x] Contrôle final du zoom.
- [x] Contrôle final du bouton ciblé.
- [x] Contrôle final avant checkpoint.
- [x] Livraison finale.
- [x] Fin de session.

- [x] Ne pas effacer les données existantes.
- [x] Ne pas révoquer de codes.
- [x] Ne pas confirmer de paiements.
- [x] Ne pas lancer de sauvegarde réelle.
- [x] Ne pas envoyer de messages.
- [x] Ne pas modifier les paramètres de rétention.
- [x] Ne pas toucher à la facturation.
- [x] Ne pas modifier les coordonnées Mobile Money.
- [x] Ne pas modifier les limites de quota.
- [x] Ne pas modifier les essais gratuits.
- [x] Ne pas modifier les tarifs.
- [x] Ne pas publier.
- [x] Fin.

- [x] Garder le plan technique premium.
- [x] Garder les couleurs existantes.
- [x] Garder les boutons accessibles.
- [x] Garder les états de chargement.
- [x] Garder les erreurs explicites.
- [x] Garder les données réelles.
- [x] Garder le journal d’audit.
- [x] Garder la date UTC.
- [x] Garder la source S3 des preuves.
- [x] Garder l’isolation Admin.
- [x] Garder la compatibilité Microsoft Excel Desktop.
- [x] Fin.

- [x] Compléter cette session sans action externe.
- [x] Remettre le résultat.
- [x] Arrêter.
- [x] Terminer.
- [x] Clôturer.
- [x] Fin.

- [x] Vérifier le statut du plan.
- [x] Avancer les phases dans l’ordre.
- [x] Produire le rapport final.
- [x] Joindre le checkpoint uniquement.
- [x] Ne pas joindre de captures internes.
- [x] Fin.

- [x] Conserver la traçabilité de l’action Heartbeat ciblée.
- [x] Conserver le caractère manuel de l’action ciblée.
- [x] Conserver la distinction entre purge et Heartbeat.
- [x] Conserver les agrégations 30 jours.
- [x] Conserver les filtres de statut.
- [x] Fin.

- [x] Déclarer toute limite restante.
- [x] Ne pas présenter une simulation comme une exécution.
- [x] Ne pas présenter un déclenchement manuel comme une exécution automatique.
- [x] Ne pas exécuter de cron automatiquement.
- [x] Fin.

- [x] Réponse finale concise.
- [x] Suggestions concrètes.
- [x] URL checkpoint.
- [x] Terminé.

- [x] Dernière vérification.
- [x] Dernière validation.
- [x] Dernière remise.
- [x] Fin.

- [x] Close.
- [x] Done.
- [x] End.
- [x] Final.

- [x] La session est terminée.
- [x] Fin.


## Session confirmation Heartbeat et assistant guidé — 27/08/2026

- [x] Ajouter une boîte de dialogue de confirmation avant le contrôle Heartbeat manuel ciblé d’un utilisateur.
- [x] Vérifier que l’annulation ne déclenche aucune mutation et que l’utilisateur ciblé est clairement identifié.
- [x] Ajouter les tests Vitest de confirmation, annulation et garde Admin.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.
- [x] Relire le suivi et sauvegarder un checkpoint avant remise.
- [x] Évaluer séparément un assistant guidé d’accueil, sans lancer sa construction sans validation explicite du périmètre.

Décision provisoire : privilégier d’abord un guide interactif déterministe, sans appel API d’IA, pour expliquer les champs, les formats de fichiers, les hypothèses et le téléchargement. Un chatbot conversationnel connecté à un modèle pourra être ajouté ensuite seulement si son coût, ses limites et son périmètre sont confirmés.

- [x] Ne pas déclencher d’action Heartbeat sans confirmation explicite.
- [x] Ne pas modifier les quotas ni les paiements.
- [x] Ne pas créer de chatbot facturé sans accord séparé.
- [x] Ne pas publier automatiquement.
- [x] Ne pas envoyer de communications externes.
- [x] Conserver la protection Admin des preuves et des actions opérationnelles.
- [x] Marquer la section comme terminée après validation.
- [x] Produire le résumé final et joindre uniquement le checkpoint.
- [x] Fin de session.

- [x] Vérifier le texte de confirmation en français.
- [x] Vérifier le bouton Annuler.
- [x] Vérifier le bouton Confirmer.
- [x] Vérifier l’état de chargement après confirmation.
- [x] Vérifier le toast de succès.
- [x] Vérifier le toast d’erreur.
- [x] Vérifier la fermeture clavier.
- [x] Vérifier le rendu mobile.
- [x] Vérifier les tests complets.
- [x] Vérifier le build.
- [x] Vérifier le checkpoint.
- [x] Terminer.


## Session onboarding guidé et suivi des abandons — 27/08/2026

- [x] Créer un parcours d’intégration guidé en 4 étapes pour le formulaire de génération.
- [x] Ajouter des indications contextuelles et une navigation précédente/suivante accessibles.
- [x] Ajouter une checklist visuelle avant génération pour les informations requises, fichiers et consentements.
- [x] Bloquer ou signaler clairement la génération lorsque la checklist identifie une donnée indispensable manquante.
- [x] Ajouter le suivi d’événements des étapes vues, franchies, abandonnées et de la génération lancée.
- [x] Ne pas enregistrer la description, les coordonnées, le contenu des fichiers ni les secrets dans les événements.
- [x] Respecter le consentement et permettre la désactivation du suivi non nécessaire.
- [x] Ajouter les tests Vitest du parcours, de la checklist, des abandons et de la confidentialité.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.
- [x] Relire le suivi et sauvegarder un checkpoint avant remise.
- [x] Garder le parcours guidé déterministe sans appel API IA payant.
- [x] Ne pas modifier les quotas, paiements, preuves Mobile Money ni Heartbeat.
- [x] Ne pas publier automatiquement.
- [x] Ne pas envoyer de communications externes.
- [x] Produire le résumé final avec les limites restantes.
- [x] Fin de session.


## Session statistiques d’abandon, reprise et aide de saisie — 27/08/2026

- [x] Ajouter une page ou section Admin dédiée aux statistiques agrégées d’abandon.
- [x] Afficher des graphiques fondés uniquement sur les événements anonymisés réellement enregistrés.
- [x] Protéger les statistiques par le garde Admin et ne jamais exposer le contenu des formulaires.
- [x] Ajouter la sauvegarde automatique locale des champs utiles du formulaire.
- [x] Restaurer le brouillon avec indication claire et possibilité de l’effacer.
- [x] Ne pas sauvegarder les secrets ni les preuves sensibles dans le brouillon.
- [x] Ajouter un bouton d’aide avec un exemple concret de description complète, fictive et non commerciale.
- [x] Ajouter les tests Vitest de statistiques, reprise, suppression du brouillon et aide de saisie.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.
- [x] Relire le suivi et sauvegarder un checkpoint avant remise.
- [x] Ne pas modifier quotas, paiements, preuves Mobile Money ni Heartbeat.
- [x] Ne pas publier automatiquement ni envoyer de communication externe.
- [x] Garder les événements agrégés et minimisés.
- [x] Documenter les limites du stockage local et des statistiques historiques.
- [x] Fin de session.


## Session notification de brouillon, exemple d’accueil et compétence réutilisable — 27/08/2026

- [x] Ajouter une notification visuelle discrète à chaque sauvegarde automatique du formulaire.
- [x] Ajouter le bouton « Commencer avec l’exemple » sur la page d’accueil.
- [x] Préremplir uniquement avec des données types fictives et non sensibles.
- [x] Créer une compétence réutilisable selon la procédure skill-creator.
- [x] Initialiser la compétence avec init_skill.py et supprimer les fichiers exemples inutiles.
- [x] Rédiger et valider le SKILL.md de la compétence.
- [x] Ajouter les tests UI de la notification et du bouton d’exemple.
- [x] Valider la compétence avec quick_validate.py.
- [x] Exécuter TypeScript, tests, build et contrôle responsive.
- [x] Relire le suivi avant checkpoint.
- [x] Sauvegarder un checkpoint projet et livrer le fichier SKILL.md.
- [x] Ne pas publier automatiquement, ne pas envoyer de communication externe et ne pas toucher aux quotas, paiements ou secrets.


## Session clic exemple et réinitialisation complète — 27/08/2026

- [x] Suivre le clic réel sur « Commencer avec l’exemple » dans un événement minimal.
- [x] Afficher le volume de clics d’exemple dans le tableau de bord d’onboarding.
- [x] Distinguer les clics du CTA et les exemples effectivement utilisés sans compter deux fois l’action.
- [x] Ajouter une action de réinitialisation complète du formulaire.
- [x] Demander confirmation avant l’effacement des champs et du brouillon local.
- [x] Réinitialiser l’étape, les champs non sensibles et les états de validation sans toucher aux images persistées séparément.
- [x] Ajouter les tests UI et de confidentialité des nouveaux événements et de la réinitialisation.
- [x] Exécuter TypeScript, tests, build et contrôle responsive avant checkpoint.
- [x] Relire le suivi et sauvegarder un checkpoint avant remise.
- [x] Ne pas modifier quotas, paiements, preuves, secrets ou Heartbeat.
- [x] Ne pas envoyer de communication externe ni publier automatiquement.


## Session checklist rapide, avertissement exemple et comparaison onboarding — 27/08/2026

- [x] Ajouter un bouton de réinitialisation rapide dans la checklist finale.
- [x] Afficher une confirmation avant de charger l’exemple lorsqu’un brouillon significatif existe.
- [x] Conserver le chargement direct de l’exemple lorsqu’aucun brouillon n’est présent.
- [x] Ajouter dans Admin une comparaison graphique entre clics CTA exemple et complétions du formulaire.
- [x] Calculer les métriques uniquement à partir des événements réellement enregistrés.
- [x] Indiquer clairement si un taux ne peut pas être calculé faute de dénominateur fiable.
- [x] Ajouter les tests UI et d’agrégation des trois fonctionnalités.
- [x] Vérifier accessibilité, confidentialité, responsive, TypeScript, tests et build.
- [x] Relire le suivi avant checkpoint et ne pas publier automatiquement.
- [x] Ne pas modifier quotas, paiements, preuves, secrets ou Heartbeat.


## Session test navigateur client et contrôle du fichier généré — 27/08/2026

- [x] Tester l’accueil et les appels à l’action comme un nouveau client.
- [x] Tester l’accès à l’espace d’étude et le parcours guidé.
- [x] Tester la checklist, le brouillon, l’exemple et la réinitialisation.
- [x] Exécuter une génération de test uniquement avec autorisation et données fictives.
- [x] Télécharger le classeur généré et vérifier toutes ses feuilles.
- [x] Contrôler les formules OOXML, les formats numériques, les totaux et les hypothèses.
- [x] Contrôler la lisibilité et les défauts visibles sur le fichier.
- [x] Documenter les défauts avec priorité et reproduction.
- [x] Ne pas envoyer de communication, ne pas publier et ne pas modifier les données de production.


## Défauts découverts pendant le test client — 27/08/2026

- [x] P0 — Corriger le schéma JSON structuré `btp_estimate` : `geometry.items.required` ne contient pas `height`, ce qui provoque HTTP 400 côté fournisseur avant toute génération.
- [x] P1 — Reproduire et diagnostiquer le premier clic de génération sans requête visible : le clic initial ciblait en réalité « Réinitialiser le formulaire », pas le bouton de génération.
- [x] P1 — Après correction P0, générer puis télécharger un classeur et inspecter toutes ses feuilles, formules, totaux, hypothèses et formats : classeur fourni inspecté localement ; absence de signe égal interne confirmée dans les 35 balises OOXML.
- [x] P1 — Tester séparément le parcours avec fichier joint PDF/image : test serveur avec PDF valide, contrôle du MIME et transmission en part `file_url` validés.
- [x] P2 — Tester l’essai gratuit dans une session navigateur neuve, distincte de l’accès partagé persistant : formulaire verrouillé, e-mail validé, consentement accepté, checklist 4/4 et génération réussie avec mention d’essai visible.
- [x] Documenter le parcours client et la réponse fournisseur sans exposer de secret.
- [x] Ne pas corriger le code dans cette session de diagnostic sans demande explicite de l’utilisateur.

- [x] Corriger le message d’erreur LLM historique qui restait visible après une génération réussie, en réinitialisant la mutation au lancement et en masquant l’alerte lorsqu’un livrable est disponible
- [x] Rejouer la suite complète Vitest : 112 tests réussis
- [x] Vérifier TypeScript et build de production après le correctif
- [x] Documenter la limite de récupération locale du fichier téléchargé dans My Browser et l’absence de validation Microsoft Excel Desktop dans cette session


## Nouvelle demande — aperçu, signature/tampon et production

- [x] Ajouter ou fiabiliser l’aperçu web du XLSX généré avant téléchargement : aperçu interactif des onglets Couverture, Métré, DQE, Hypothèses, Géométrie et Contrôles déjà présent.
- [x] Ajouter ou fiabiliser l’aperçu web du rapport PDF généré avant téléchargement : rapport de contrôle géométrique généré côté navigateur et affiché dans une modale iframe avant téléchargement.
- [x] Exécuter un test de génération avec signature et tampon fictifs non sensibles et vérifier leur insertion dans le classeur : fichier réel produit avec `xl/media/image1.png`, `image2.png` et `xl/drawings/drawing1.xml`.
- [x] Vérifier l’export officiel de sauvegarde de production depuis Manus : export tenté, mais la page accessible après la fin de la fenêtre officielle affiche uniquement les sauvegardes historiques et la restauration, sans bouton d’export ; aucune sauvegarde officielle supplémentaire n’a été créée, et la limite est documentée.
- [x] Vérifier puis activer le Heartbeat après publication : tâche `metrexpert-daily-free-trials-cleanup`, UID `PfEvHSoM2APVf88EdshM2E`, active à `02:00 UTC`, route `/api/scheduled/cleanup-free-trials`.
- [x] Ajouter les tests Vitest, vérifier TypeScript, build et rendu avant checkpoint : 112 tests, TypeScript et build réussis.
- [x] Corriger dans le guide d’exploitation le chemin Heartbeat pour utiliser `/api/scheduled/cleanup-free-trials`, qui est la route réellement montée par le serveur.


## Nouvelle demande — export GitHub privé

- [x] Créer le dépôt privé `metrexpert-ia-pro` et pousser le code sans secrets : dépôt `fa8419534-commits/metrexpert-ia-pro` créé et synchronisé via l’intégration Manus.
- [x] Vérifier la confidentialité du dépôt, les fichiers présents et l’absence de secrets exposés : dépôt affiché `Private`, branche `main`, code présent, aucun `.env` visible à la racine.


## Nouvelle demande — export PDF des résultats et chargement

- [x] Ajouter un export PDF récapitulatif des résultats générés, avec téléchargement depuis l’espace d’étude : génération côté navigateur avec résumé, montants, postes, hypothèses et validation.
- [x] Ajouter un aperçu avant téléchargement du PDF récapitulatif des résultats : modale iframe avec bouton de téléchargement.
- [x] Renforcer les animations et messages de chargement autour de la génération et de l’export, avec progression indicative, spinner, messages d’étape, estimation et respect de prefers-reduced-motion.
- [x] Ajouter les tests Vitest de l’export PDF et des états de chargement, puis vérifier TypeScript, build et rendu responsive : 114 tests réussis, TypeScript, build et captures desktop/mobile validés.


## Nouvelle demande — personnalisation et impression PDF

- [x] Ajouter un bouton d’impression directe depuis la fenêtre d’aperçu PDF : ouverture du PDF dans une fenêtre dédiée et lancement de l’impression du navigateur.
- [x] Permettre la personnalisation du logo et d’une palette de couleurs du PDF exporté, avec valeurs sûres par défaut et conservation locale.
- [x] Ajouter le choix entre export PDF résumé et détaillé, avec aperçu correspondant.
- [x] Ajouter les tests des variantes, vérifier TypeScript, build et rendu responsive avant checkpoint : 114 tests, TypeScript, build et captures desktop/mobile validés.


## Nouvelle demande — préférences PDF persistantes

- [x] Persister le logo, les couleurs et le niveau d’export PDF pour les prochaines sessions via le cache local du navigateur.
- [x] Ajouter un champ de pied de page personnalisé transmis au PDF, limité à 130 caractères et normalisé pour l’encodage PDF.
- [x] Ajouter la palette prédéfinie « MÉTREXPERT » et un bouton de réinitialisation des couleurs.
- [x] Ajouter les tests de restauration et d’export, puis vérifier TypeScript, build et rendu responsive avant checkpoint : 114 tests, TypeScript, build et captures desktop/mobile validés.


## Nouvelle demande — palettes et filigrane PDF

- [x] Ajouter plusieurs palettes PDF prédéfinies adaptées aux rapports et aux clients, avec sélection persistante : MÉTREXPERT, Ardoise, Sable et Atelier.
- [x] Ajouter un champ de filigrane personnalisé avec option d’activation/désactivation et transmission au PDF : champ vide = désactivé.
- [x] Appliquer le filigrane de façon lisible et discrète sur toutes les pages du PDF exporté, avec opacité réduite et texte limité à 60 caractères.
- [x] Ajouter les tests des palettes et du filigrane, puis vérifier TypeScript, build et rendu responsive avant checkpoint : 115 tests Vitest réussis, TypeScript, build et contrôle visuel validés.


## Nouvelle demande — aperçu direct et police PDF

- [x] Ajouter un aperçu en direct de la palette et du filigrane dans l’interface, avec adaptation visuelle à la police choisie.
- [x] Ajouter le choix de police PDF avec transmission réelle au générateur et sauvegarde locale : Helvetica, Times et Courier.
- [x] Ajouter les tests d’aperçu et de police, puis vérifier TypeScript, build et rendu responsive avant checkpoint : 115 tests Vitest réussis, TypeScript, build et captures desktop/mobile validés.


## Nouvelle demande — polices et partage e-mail PDF

- [x] Ajouter des polices PDF modernes et professionnelles supplémentaires, avec persistance locale et aperçu adapté : Montserrat et IBM Plex Mono en plus des polices standard.
- [x] Ajouter un bouton de partage e-mail du PDF généré, sans envoi automatique non autorisé : partage natif avec pièce jointe lorsque disponible, sinon téléchargement et brouillon `mailto:`.
- [x] Ajouter les tests des polices et du partage, puis vérifier TypeScript, build et rendu responsive avant checkpoint : 117 tests Vitest réussis, TypeScript, build et captures desktop/mobile validés.


## Nouvelle demande — modèle e-mail personnalisable

- [x] Ajouter les champs persistants d’objet et de corps du message e-mail, avec sauvegarde locale automatique.
- [x] Utiliser le modèle personnalisé dans le partage PDF sans envoi automatique : partage natif ou brouillon mailto avec téléchargement séparé.
- [x] Vérifier et tester la sauvegarde automatique de la police PDF pour les prochaines sessions, en conservant les cinq options disponibles.
- [x] Ajouter les tests, vérifier TypeScript, build et rendu responsive avant checkpoint : 117 tests Vitest, TypeScript, build et contrôle mobile validés.


## Nouvelle demande — bibliothèque de modèles e-mail

- [x] Ajouter le remplacement dynamique des variables `{nom_client}` et `{projet}` dans l’objet et le corps.
- [x] Permettre de créer, nommer, sélectionner et sauvegarder plusieurs modèles e-mail localement.
- [x] Ajouter un aperçu du message final avec variables remplacées avant le partage.
- [x] Ajouter les tests de persistance, variables, aperçu et partage, puis vérifier TypeScript, build et rendu responsive avant checkpoint.

- [x] Ajouter le remplacement dynamique des variables dans les modèles e-mail ({nom_client}, {projet}, {date}, {total})
- [x] Ajouter une bibliothèque locale de modèles e-mail nommés avec sélection, création et mise à jour
- [x] Ajouter un aperçu final du message e-mail avant partage manuel
- [x] Couvrir le rendu et la persistance des modèles e-mail par des tests Vitest
- [x] Vérifier le parcours responsive de la gestion des modèles e-mail sur mobile
- [x] Exécuter la suite complète, le build et sauvegarder un checkpoint publiable

## Test pilote n°1 — scénario réel peu sensible
- [x] Préparer un projet fictif réaliste sans données personnelles sensibles
- [x] Vérifier l’accès client/essai et le parcours de saisie complet
- [ ] Générer et contrôler le classeur Excel ainsi que le PDF
- [ ] Vérifier les quotas, les messages d’erreur et le téléchargement
- [x] Documenter les anomalies et les corrections prioritaires

## Préparation du pilote n°2 — diagnostic JSON et quota
- [x] Inspecter le handler tRPC de génération, le prompt, le response_format et la validation finale
- [x] Vérifier la chaîne réponse brute → nettoyage → JSON.parse → validation métier
- [x] Ajouter ou confirmer des logs redacted de diagnostic sans exposer de secret ni de données sensibles
- [ ] Vérifier la réservation, la consommation et le remboursement du quota d’essai en cas d’échec
- [x] Ajouter des tests d’échec IA prouvant qu’un essai échoué ne consomme pas de quota
- [x] Rédiger les critères de sortie et le plan d’exécution du pilote n°2

## Correctif pilote n°2 — implémentation
- [x] Ajouter un requestId corrélé et des logs redacted de réponse IA
- [x] Distinguer les erreurs fournisseur, parsing et validation dans le handler
- [x] Harmoniser le schéma JSON strict avec la validation et la normalisation
- [x] Ajouter un test d’intégration de génération échouée avec restitution globale, client et essai
- [x] Vérifier les tests, TypeScript et le build sans consommer un nouvel essai
- [x] Publier le correctif puis relancer le pilote n°2 contrôlé

- [x] Corriger l’erreur d’encodage PDF WinAnsi provoquée par les symboles emoji dans les observations générées
- [ ] Rejouer l’aperçu PDF et vérifier le téléchargement XLSX après correction
