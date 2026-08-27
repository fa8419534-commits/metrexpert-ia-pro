# Constats techniques — pilote n°1

Le test publié sur `https://metrexpert-qx6adg9a.manus.space/etude` a validé le formulaire, le téléphone fictif, l’e-mail fictif, le consentement et la checklist 4/4. La génération texte seul a ensuite échoué avec « Le JSON renvoyé par l’IA ne respecte pas le format attendu. » Aucun livrable n’a été produit.

Le routeur `server/routers.ts` utilise un `estimateSchema` JSON Schema strict envoyé à `invokeLLM`, avec tous les champs des mesures requis (`code`, `designation`, `unit`, `quantity`, `unitPrice`, `factor`, `notes`) et tous les champs de géométrie requis, même quand leurs valeurs peuvent être nulles. Le résultat reçu est ensuite extrait depuis `choices[0].message.content`, passé à `parseJsonObjectFromLLM`, puis à `validateEstimate`, qui renvoie un message générique si la validation Zod échoue.

La réservation globale horaire/journalière est séparée de la réservation d’essai. `reserveGenerationQuota()` incrémente les fenêtres hour/day et renvoie une réservation libérable via `releaseGenerationQuota()`. Il faut encore vérifier dans le handler si cette libération est exécutée dans tous les `catch`.

Une trace locale trouvée dans `devserver.log` montre un ancien appel avec modèle `claude-sonnet-4-6`, `max_tokens: 12000`, `hasFile: false` et une enveloppe LLM sans erreur ; elle ne correspond pas au scénario pilote 90 m². Il manque donc une trace corrélée par requête du pilote, avec réponse brute tronquée, JSON nettoyé et erreurs de validation.
