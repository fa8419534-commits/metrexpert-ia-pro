# Conservation des contacts d’essai gratuit

## Réglage livré

Le panneau `/admin` propose désormais un réglage persistant de la durée de conservation des contacts d’essai gratuit. La valeur est exprimée en jours et est limitée à une plage opérationnelle de **30 à 730 jours**. La valeur par défaut est de **365 jours** lorsqu’aucun réglage n’a encore été enregistré.

La purge supprime uniquement les lignes `free_trial_contacts` dont `trialAt` est antérieur à la date de coupure calculée. Elle ne supprime ni les codes clients, ni les demandes de paiement, ni les compteurs de génération. La procédure est idempotente : une seconde exécution sur la même période ne supprime aucune ligne supplémentaire.

## Utilisation dans Admin

Après ouverture de la session administrateur, la section **Conservation des contacts** affiche la valeur active. Saisissez un nombre entier entre 30 et 730, puis sélectionnez **Enregistrer**. Le bouton **Purger les contacts échus** ouvre une confirmation explicite avant toute suppression définitive.

La durée doit être choisie en fonction de la finalité commerciale réelle et de la politique de confidentialité applicable. Une durée longue n’est pas automatiquement préférable : elle augmente la période pendant laquelle des coordonnées de prospects restent conservées.

## Purge automatique

Le serveur contient la callback protégée `POST /api/scheduled/cleanup-free-trials`. Elle refuse les appels ordinaires et n’accepte qu’une identité de tâche planifiée authentifiée. Elle exécute la même fonction idempotente que la purge manuelle et journalise le nombre de lignes supprimées, la durée retenue et la date de coupure.

La tâche quotidienne ne doit être activée qu’après publication du site, car le service planifié doit appeler l’URL de production et non l’URL de développement. Après publication, créer une tâche quotidienne à une heure creuse, par exemple **01:30 UTC**, vers `/api/scheduled/cleanup-free-trials`, puis vérifier son premier résultat dans les journaux. Si la tâche n’est pas activée, la purge manuelle reste disponible dans Admin.

## Données supprimées

La suppression retire les coordonnées et métadonnées associées au contact d’essai : nom, téléphone, e-mail, dates d’essai, consentement, conversion, relance WhatsApp et désinscription. Les exports CSV déjà téléchargés par l’administrateur ne sont pas récupérables par l’application et doivent être gérés séparément selon la même politique de conservation.

## Limites de validation

La validation effectuée dans le projet couvre la plage de valeurs, la persistance en mémoire de test, le calcul de coupure, la suppression sélective et l’idempotence. L’activation réelle d’une tâche quotidienne et le comportement sur la base de production doivent encore être vérifiés après publication avec un jeu de données réel, sans insérer de données de test dans la base de production.
