# Diagnostic du badge d’erreurs Admin

Le badge rouge « 3 errors » observé dans la capture appartient à l’interface de supervision de l’aperçu, et non à un composant rendu par MÉTREXPERT IA PRO. Les trois erreurs historiques correspondaient à trois requêtes protégées lancées avant la confirmation du cookie administrateur ; chacune retournait HTTP 401 avec le message « Accès administrateur requis ».

Le correctif côté application conditionne désormais les listes Admin à `adminStatus.unlocked === true` et désactive les retries automatiques des erreurs 401. Un rechargement verrouillé ne produit donc plus ces trois requêtes.

L’application ne peut pas supprimer rétroactivement l’historique ou le compteur d’erreurs conservé par l’interface de supervision. Pour faire disparaître un badge historique, il faut utiliser le rafraîchissement ou le redémarrage proposé par cette interface. Cette limite ne signifie pas qu’une nouvelle erreur est encore produite par l’application.

Validation : 80 tests réussis, TypeScript sans erreur, build de production réussi et rechargement `/admin` verrouillé vérifié.
