from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers


class TokenLMSSerializer(TokenObtainPairSerializer):
    """
    Extends TokenObtainPairSerializer to include additional user information
    in the token response and to prevent token issuance for deactivated users.
    """

    def validate(self, attrs):
        data = super().validate(attrs)

        # Verificar que el usuario esté activo (estadousuario == 1)
        if getattr(self.user, "estadousuario", 1) != 1:
            raise serializers.ValidationError({"detail": "Usuario desactivado"})

        data["is_admin"] = int(getattr(self.user, "tipousuario", 0) or 0)

        return data