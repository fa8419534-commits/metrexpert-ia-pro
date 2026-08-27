# Contrôle visuel — exemple d’accueil

Le CTA « Commencer avec l’exemple » apparaît au côté du bouton principal dans le hero de l’accueil. Il conserve la palette technique et reste lisible en desktop.

L’URL `/etude?example=1` active le préremplissage explicite avec la description fictive partagée par l’aide, positionne le parcours à l’étape 2, enregistre un événement minimal `example_started`, puis nettoie le paramètre de l’URL. Un brouillon existant n’écrase pas cette action explicite.

Le formulaire affiche une notification discrète « Brouillon sauvegardé automatiquement » après écriture effective du brouillon local. Un brouillon vide n’est pas créé ni signalé.

Contrôle visuel desktop effectué sur `/` et `/etude?example=1`. Le rendu reste aligné avec l’identité « plan technique ». Le contrôle mobile doit être inclus dans la validation finale.


Contrôle mobile 390×844 effectué sur les mêmes routes. Le CTA d’exemple s’empile proprement sous le bouton principal et le header reste lisible. L’espace d’étude conserve une cartouche verticale lisible ; la suite du formulaire est accessible par défilement. Aucun débordement horizontal n’a été observé dans la zone capturée.
