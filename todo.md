# Project TODO

- [x] Page publique unique, élégante et responsive pour MÉTREXPERT IA PRO
- [x] Zone de saisie obligatoire pour la description du projet BTP
- [x] Dépôt facultatif d’un fichier PDF ou image avec validation du type et de la taille
- [x] Affichage de la progression de l’analyse et de la génération
- [x] Gestion claire des erreurs côté interface et serveur
- [x] Appel serveur à Claude avec le modèle claude-sonnet-4-6
- [x] Support d’un prompt système métier BTP fourni ultérieurement par l’utilisateur
- [x] Validation stricte du JSON structuré renvoyé par Claude avant génération
- [x] Génération serveur d’un fichier .xlsx
- [x] Feuille Excel « Couverture »
- [x] Feuille Excel « Métré » avec formules actives de calcul des quantités
- [x] Feuille Excel « DQE » avec formules actives de calcul des montants et totaux
- [x] Bouton de téléchargement du fichier généré
- [x] Aucun compte utilisateur, paiement, tableau de bord ou stockage en base de données
- [x] Tests unitaires Vitest du schéma JSON et de la génération Excel
- [x] Vérification visuelle desktop et mobile du parcours MVP
- [x] Vérification du build et des erreurs runtime

- [x] Adapter le prompt source au mode mono-échange sans changer les règles métier
- [x] Remplacer les questions bloquantes par le marqueur « 🔴 DONNÉE MANQUANTE — à préciser : [nom de la donnée] »
- [x] Imposer une sortie JSON structurée exploitable par le générateur Excel serveur
- [x] Interdire explicitement à Claude de créer ou retourner un fichier .xlsx
- [x] Ajouter un test vérifiant que le prompt adapté est transmis à l’appel Claude
- [x] Ajouter un test Vitest de estimate.generate vérifiant que le prompt système exact est transmis à invokeLLM
