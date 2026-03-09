interface FileUploadErrorProps {
  error: string | null;
  onClose?: () => void;
  detailedErrors?: string[];
  warningMessage?: string;
  successCount?: number;
  totalCount?: number;
  type?: 'error' | 'warning' | 'success' | 'info';
}

export default function FileUploadError({
  error,
  onClose,
  detailedErrors = [],
  warningMessage,
  successCount,
  totalCount,
  type = 'error'
}: FileUploadErrorProps) {
  if (!error && !warningMessage && type !== 'success') return null;

  const getContainerStyle = () => {
    switch (type) {
      case 'error':
        return { background: '#fee', borderLeft: '4px solid #c33', padding: 12, marginBottom: 16, borderRadius: 4 };
      case 'warning':
        return { background: '#fef3cd', borderLeft: '4px solid #ffc107', padding: 12, marginBottom: 16, borderRadius: 4 };
      case 'success':
        return { background: '#d4edda', borderLeft: '4px solid #28a745', padding: 12, marginBottom: 16, borderRadius: 4 };
      case 'info':
        return { background: '#d1ecf1', borderLeft: '4px solid #17a2b8', padding: 12, marginBottom: 16, borderRadius: 4 };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return '#721c24';
      case 'warning':
        return '#856404';
      case 'success':
        return '#155724';
      case 'info':
        return '#0c5460';
      default:
        return '#333';
    }
  };

  return (
    <div style={getContainerStyle()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          {/* Título con ícono */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>
              {type === 'error' && '❌'}
              {type === 'warning' && '⚠️'}
              {type === 'success' && '✅'}
              {type === 'info' && 'ℹ️'}
            </span>
            <strong style={{ color: getTextColor(), fontSize: 14 }}>
              {type === 'error' && 'Error al cargar archivo'}
              {type === 'warning' && 'Advertencia'}
              {type === 'success' && 'Archivo cargado exitosamente'}
              {type === 'info' && 'Información'}
            </strong>
          </div>

          {/* Mensaje principal */}
          {error && (
            <p style={{ margin: '8px 0', color: getTextColor(), fontSize: 13, lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          {warningMessage && (
            <p style={{ margin: '8px 0', color: getTextColor(), fontSize: 13, lineHeight: 1.5 }}>
              {warningMessage}
            </p>
          )}

          {/* Conteo de éxitos */}
          {successCount !== undefined && totalCount !== undefined && (
            <p style={{ margin: '8px 0', color: getTextColor(), fontSize: 13, fontWeight: 500 }}>
              Procesados: <strong>{successCount}</strong> de <strong>{totalCount}</strong>
            </p>
          )}

          {/* Errores detallados */}
          {detailedErrors.length > 0 && (
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <p style={{ margin: '0 0 8px 0', color: getTextColor(), fontSize: 12, fontWeight: 500 }}>
                Detalles:
              </p>
              <ul style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 12,
                color: getTextColor(),
                lineHeight: 1.6
              }}>
                {detailedErrors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {detailedErrors.length > 5 && (
                  <li style={{ marginTop: 4, fontStyle: 'italic' }}>
                    ... y {detailedErrors.length - 5} errores más
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Botón cerrar */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: getTextColor(),
              padding: '4px 8px',
              marginTop: -4
            }}
            title="Cerrar"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
