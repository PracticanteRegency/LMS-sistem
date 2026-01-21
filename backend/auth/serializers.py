from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class TokenLMSSerializer(TokenObtainPairSerializer):
    """
    Extends TokenObtainPairSerializer to include additional user information
    in the token response.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["is_admin"] = int(getattr(self.user, "tipousuario", 0) or 0)

        return data