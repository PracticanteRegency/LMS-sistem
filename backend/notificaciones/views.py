from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from models import Notificacion
from serializers import NotificacionSerializer
from utils import enviar_notificacion_email


class MarcarNotificacionLeidaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notificacion = Notificacion.objects.get(pk=pk, colaborador=request.user.idcolaborador)
            notificacion.leido = True
            notificacion.save()
            return Response({'mensaje': 'Notificación marcada como leída'}, status=status.HTTP_200_OK)
        except Notificacion.DoesNotExist:
            return Response({'error': 'Notificación no encontrada'}, status=status.HTTP_404_NOT_FOUND)


class NotificacionesUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        colaborador = request.user.idcolaborador
        notificaciones = Notificacion.objects.filter(colaborador=colaborador).order_by('-fecha_creacion')
        serializer = NotificacionSerializer(notificaciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    



class EnviarCorreoView(APIView):
    def post(self, request):
        correo = request.data.get('correo')
        asunto = request.data.get('asunto', 'Notificación del sistema')
        mensaje = request.data.get('mensaje', 'Hola, tienes una nueva notificación.')

        try:
            enviar_notificacion_email(correo, asunto, mensaje)
            return Response({'message': 'Correo enviado correctamente'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
