# Protections de coût et d’accès

## Valeurs actives

| Protection | Valeur | Portée |
|---|---:|---|
| Code d’accès partagé | Secret `METREXPERT_ACCESS_CODE` | Requis avant chaque génération ; cookie HTTP-only valable 7 jours |
| Rate limiting horaire | 5 générations | Par utilisateur Manus si connecté, sinon par adresse IP et fenêtre UTC d’une heure |
| Quota global quotidien | 50 générations | Toute l’application, fenêtre UTC du jour |
| Compteur admin | Générations du jour / 50 | Visible dans l’interface lorsqu’un administrateur Manus est connecté |

Les compteurs sont persistés dans `generation_windows` lorsque la base de données est disponible. Le serveur incrémente les fenêtres avant l’appel payant au LLM ; une génération refusée par une limite ne contacte donc pas le fournisseur. Les erreurs de code d’accès, de rate limiting et de quota renvoient des messages explicites à l’interface.

Le code d’accès n’est jamais renvoyé au frontend ni écrit dans les logs. Le cookie est `httpOnly`, `sameSite=lax`, et `secure` en production. Les tests utilisent uniquement un repli mémoire isolé ; ils n’écrivent pas dans la base de production.

Cette protection réduit fortement le risque d’usage accidentel ou abusif, mais ne remplace pas un système complet de comptes, une gestion de rôles plus fine, une surveillance d’alertes ou une facturation avec plafond fournisseur.
